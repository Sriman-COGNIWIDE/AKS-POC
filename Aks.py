from kubernetes import client, config
import urllib3
import json
import re
from datetime import datetime

def extract_version_from_image(image_string):
    """Extract version from image string using regex"""
    # Try to match version patterns like: v1.2.3, 1.2.3, v1.2, 1.2
    version_pattern = r'[v]?(\d+\.\d+(?:\.\d+)?(?:-\w+)?)'
    match = re.search(version_pattern, image_string)
    if match:
        return match.group(1)
    return "unknown"

def get_cluster_info():
    """
    Get simplified information about namespaces, deployments, and pods from a Kubernetes cluster
    """
    try:
        # Disable SSL verification warnings
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Load the kubeconfig file
        config.load_kube_config()
        
        # Get the current context configuration
        configuration = client.Configuration.get_default_copy()
        configuration.verify_ssl = False
        
        # Create API clients
        api_client = client.ApiClient(configuration)
        v1 = client.CoreV1Api(api_client)
        apps_v1 = client.AppsV1Api(api_client)
        
        # Initialize cluster info dictionary
        cluster_info = {
            "namespaces": {}
        }

        # Get all namespaces
        namespaces = v1.list_namespace(_preload_content=False)
        namespaces = client.ApiClient().deserialize(namespaces, 'V1NamespaceList')
        
        for ns in namespaces.items:
            namespace_name = ns.metadata.name
            cluster_info["namespaces"][namespace_name] = {
                "deployments": {}
            }
            
            # Get deployments for namespace
            deployments = apps_v1.list_namespaced_deployment(namespace_name, _preload_content=False)
            deployments = client.ApiClient().deserialize(deployments, 'V1DeploymentList')
            
            for deployment in deployments.items:
                deployment_name = deployment.metadata.name
                cluster_info["namespaces"][namespace_name]["deployments"][deployment_name] = {
                    "pods": []
                }

                # Get pods for the deployment using label selector
                label_selector = ",".join([f"{k}={v}" for k, v in deployment.spec.selector.match_labels.items()])
                pods = v1.list_namespaced_pod(
                    namespace_name,
                    label_selector=label_selector,
                    _preload_content=False
                )
                pods = client.ApiClient().deserialize(pods, 'V1PodList')
                
                for pod in pods.items:
                    pod_info = {
                        "name": pod.metadata.name,
                        "pod_ip": pod.status.pod_ip if pod.status.pod_ip else None,
                        "start_time": pod.status.start_time.isoformat() if pod.status.start_time else None,
                        "containers": []
                    }
                    
                    for container in pod.spec.containers:
                        container_info = {
                            "name": container.name,
                            "image": container.image,
                            "version": extract_version_from_image(container.image)
                        }
                        pod_info["containers"].append(container_info)
                    
                    cluster_info["namespaces"][namespace_name]["deployments"][deployment_name]["pods"].append(pod_info)

        # Save output to JSON file
        with open('cluster_info.json', 'w') as f:
            json.dump(cluster_info, f, indent=2)
            
        return cluster_info

    except client.rest.ApiException as api_error:
        error_response = {
            "error": {
                "type": "ApiException",
                "status": api_error.status,
                "message": api_error.body
            }
        }
        return error_response
        
    except Exception as e:
        error_response = {
            "error": {
                "type": "GeneralException",
                "message": str(e)
            }
        }
        return error_response

if __name__ == "__main__":
    print("Fetching Kubernetes cluster information...")
    result = get_cluster_info()
    print(json.dumps(result, indent=2))