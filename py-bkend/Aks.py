from flask import Flask, jsonify
from kubernetes import client, config
import urllib3
import re
from flask_cors import CORS
import os
from kubernetes.client import ApiClient
from kubernetes.config import list_kube_config_contexts, load_kube_config

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

def get_available_clusters():
    """Get list of available clusters from kube config"""
    try:
        contexts, active_context = list_kube_config_contexts()
        return [context['name'] for context in contexts]
    except:
        return []

def extract_version_from_image(image_string):
    """Extract version from image string using regex"""
    version_pattern = r'[v]?(\d+\.\d+(?:\.\d+)?(?:-\w+)?)'
    match = re.search(version_pattern, image_string)
    if match:
        return match.group(1)
    return "unknown"

def process_container_images(containers):
    """Process container images and extract versions"""
    if not containers:
        return []
    
    container_info = []
    for container in containers:
        image = container.image
        version = extract_version_from_image(image)
        container_info.append({
            "image": image,
            "version": version
        })
    return container_info

def get_cluster_info(cluster_name):
    """Get information about deployments from specific cluster"""
    try:
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        available_clusters = get_available_clusters()
        
        if cluster_name not in available_clusters:
            return {
                "status": "error",
                "error": {
                    "type": "ClusterNotFound",
                    "message": f"Cluster '{cluster_name}' not found. Available clusters: {available_clusters}"
                }
            }
        
        load_kube_config(context=cluster_name)
        
        apps_v1 = client.AppsV1Api()
        v1 = client.CoreV1Api()
        
        cluster_info = []
        
        namespaces = v1.list_namespace()
        
        for ns in namespaces.items:
            namespace_name = ns.metadata.name
            
            deployments = apps_v1.list_namespaced_deployment(namespace_name)
            
            for deployment in deployments.items:
                deployment_info = {
                    "deployment-name": deployment.metadata.name,
                    "namespace": namespace_name,
                    "cluster": cluster_name,
                    "main-containers": process_container_images(deployment.spec.template.spec.containers),
                    "init-containers": process_container_images(deployment.spec.template.spec.init_containers) if deployment.spec.template.spec.init_containers else []
                }
                
                cluster_info.append(deployment_info)
            
        return {"status": "success", "data": cluster_info}

    except Exception as e:
        return {
            "status": "error",
            "error": {
                "type": "GeneralException",
                "message": str(e)
            }
        }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

@app.route('/api/clusters', methods=['GET'])
def list_clusters():
    """List all available clusters"""
    try:
        clusters = get_available_clusters()
        return jsonify({
            "status": "success",
            "data": clusters
        })
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
    """Get deployments for a specific cluster"""
    try:
        result = get_cluster_info(cluster_name)
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
    app.run(host='0.0.0.0', port=port, debug=True)