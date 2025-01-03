from flask import Flask, jsonify
from kubernetes import client
import urllib3
import re
from flask_cors import CORS
import os
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import time
from threading import Lock
 
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "OPTIONS", "POST"],
        "allow_headers": ["Content-Type"]
    }
})
 
CACHE_DURATION = 300
 
CLUSTERS = {
    "minikube": {
        "host": "https://127.0.0.1:65046",
        "token": os.environ.get("MINIKUBE_TOKEN")
    },
    "aks-pe-poc": {
        "host": "https://aks-pe-poc-dns-t2aw702d.hcp.centralindia.azmk8s.io:443",
        "token": os.environ.get("AKS_TOKEN")
    }
}
 
executor = ThreadPoolExecutor(max_workers=4)
cache_lock = Lock()
 
VERSION_PATTERN = re.compile(r':([^:@]+)(?:@sha256:.+)?$')
 
k8s_clients = {}
 
def initialize_k8s_clients():
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    for cluster_name, cluster_info in CLUSTERS.items():
        configuration = client.Configuration()
        configuration.host = cluster_info["host"]
        configuration.verify_ssl = False
        configuration.api_key = {"authorization": f"Bearer {cluster_info['token']}"}
       
        api_client = client.ApiClient(configuration)
        k8s_clients[cluster_name] = {
            "apps_v1": client.AppsV1Api(api_client),
            "core_v1": client.CoreV1Api(api_client)
        }
 
initialize_k8s_clients()
 
def extract_version_from_image(image_string):
    match = VERSION_PATTERN.search(image_string)
    if not match:
        return "unknown"
    
    version = match.group(1)
    if version.startswith('v'):
        version = version[1:]
    return version
 
def process_container_images(containers):
    if not containers:
        return []
   
    return [{
        "image": container.image,
        "version": extract_version_from_image(container.image)
    } for container in containers]
 
@lru_cache(maxsize=128)
def get_cluster_info_cached(cluster_name, timestamp):
    """Cached version of cluster info retrieval"""
    try:
        if cluster_name not in k8s_clients:
            return {
                "status": "error",
                "error": {
                    "type": "ClusterNotFound",
                    "message": f"Cluster '{cluster_name}' not found"
                }
            }
       
        clients = k8s_clients[cluster_name]
        cluster_info = []
       
        namespaces = clients["core_v1"].list_namespace()
       
        def process_namespace(ns):
            namespace_name = ns.metadata.name
            deployments = clients["apps_v1"].list_namespaced_deployment(namespace_name)
           
            namespace_info = []
            for deployment in deployments.items:
                deployment_info = {
                    "deployment-name": deployment.metadata.name,
                    "namespace": namespace_name,
                    "cluster": cluster_name,
                    "main-containers": process_container_images(deployment.spec.template.spec.containers),
                    "init-containers": process_container_images(deployment.spec.template.spec.init_containers) if deployment.spec.template.spec.init_containers else []
                }
                namespace_info.append(deployment_info)
            return namespace_info
       
        futures = [executor.submit(process_namespace, ns) for ns in namespaces.items]
        for future in futures:
            cluster_info.extend(future.result())
           
        return {"status": "success", "data": cluster_info}
 
    except Exception as e:
        return {
            "status": "error",
            "error": {
                "type": "GeneralException",
                "message": str(e)
            }
        }
 
def get_cache_timestamp():
    """Return current timestamp rounded to cache duration"""
    return int(time.time() / CACHE_DURATION) * CACHE_DURATION
 
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})
 
@app.route('/api/clusters', methods=['GET'])
def list_clusters():
    return jsonify({
        "status": "success",
        "data": list(CLUSTERS.keys())
    })
 
@app.route('/api/<env>', methods=['GET'])
def get_deployments_by_env(env):
    try:
        if env.lower() == "poc":
            timestamp = get_cache_timestamp()
            all_deployments = []
           
            futures = [
                executor.submit(get_cluster_info_cached, cluster_name, timestamp)
                for cluster_name in CLUSTERS.keys()
            ]
           
            for future in futures:
                result = future.result()
                if result.get("status") == "success":
                    all_deployments.extend(result["data"])
           
            return jsonify({
                "status": "success",
                "data": all_deployments
            })
           
        return jsonify({
            "status": "error",
            "error": {
                "type": "InvalidEnvironment",
                "message": f"Environment '{env}' not supported"
            }
        }), 404
       
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": {
                "type": "GeneralException",
                "message": str(e)
            }
        }), 500
 
@app.route('/api/clusters/<cluster_name>/deployments', methods=['GET'])
def get_deployments(cluster_name):
    try:
        timestamp = get_cache_timestamp()
        result = get_cluster_info_cached(cluster_name, timestamp)
        if result.get("status") == "error":
            return jsonify(result), 404
        return jsonify(result)
       
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": {
                "type": "GeneralException",
                "message": str(e)
            }
        }), 500
 
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True)