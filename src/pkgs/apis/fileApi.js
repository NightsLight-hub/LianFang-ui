import axios from "axios";

export class FileApi {
    constructor(pvc) {
        this.pvc = pvc;
    }
    bind() {
        return new Promise((resolve, reject) => {
            let url = `/api/bind/${this.pvc.namespace}/${this.pvc.name}`;
            axios.get(url)
                .then(response => {
                    resolve(response.data);
                }).catch(error => {
                reject(error);
            });
        });
    }

    downloadUrl(...paths) {
        return `/api/download/${this.pvc.namespace}/${this.pvc.name}/?p=${paths.map(v => encodeURIComponent(v)).join("&p=")}`;
    }

    show(path, dirOnly) {
        return new Promise((resolve, reject) => {
            let url = `/api/show/${encodeURIComponent(path)}${dirOnly ? "?dirOnly=true" : ""}`;
            axios.get(url, {
                headers: {
                    'X-Context-Namespace': this.pvc.namespace,
                    'X-Context-PVC': this.pvc.name,
                }
            }).then(response => {
                if (response.data.files) {
                    resolve(response.data.files);
                } else {
                    resolve(response.data.content);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }
    // 解压缩
    uncompress(path, dest) {
        return new Promise((resolve, reject) => {
            let url = `/api/uncompress/${encodeURIComponent(path)}`;
            axios.put(url, `dest=${encodeURIComponent(dest)}`, {
                headers: {
                    'X-Context-Namespace': this.pvc.namespace,
                    'X-Context-PVC': this.pvc.name,
                }
            }).then(response => {
                if (response.data.files) {
                    resolve(response.data.files);
                } else {
                    resolve(response.data.content);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }
    // 移动
    move(path, dest) {
        return new Promise((resolve, reject) => {
            let url = `/api/move/${encodeURIComponent(path)}`;
            axios.patch(url, `dest=${encodeURIComponent(dest)}`, {
                headers: {
                    'X-Context-Namespace': this.pvc.namespace,
                    'X-Context-PVC': this.pvc.name,
                }
            }).then(response => {
                if (response.data.files) {
                    resolve(response.data.files);
                } else {
                    resolve(response.data.content);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    // 上传
    upload(onUploadProgress, destPath, conflictPolicy, ...localFiles) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("dest", destPath);
            formData.append("conflictPolicy", conflictPolicy);
            localFiles.forEach(file => {
                formData.append('files', file);

                file.localRelativePath = file.relativePath || file.webkitRelativePath;
                if (!file.localRelativePath) {
                    file.localRelativePath = file.name;
                }
                formData.append('fileRelativePaths', file.localRelativePath);
            });
            let url = `/api/upload`;
            axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Context-Namespace': this.pvc.name,
                    'X-Context-PVC': this.pvc.name
                },
                onUploadProgress: onUploadProgress
            }).then(response => {
                console.log(response);
                resolve(response.data);
            }).catch(error => {
                reject(error);
            });
        });
    }
    delete(...paths) {
        return new Promise((resolve, reject) => {
            let url = `/api/delete/?p=${paths.map(v => encodeURIComponent(v)).join("&p=")}`;
            axios.delete(url, {
                headers: {
                    'X-Context-Namespace': this.pvc.namespace,
                    'X-Context-PVC': this.pvc.name,
                }
            }).then(response => {
                resolve(response.data);
            }).catch(error => {
                reject(error);
            });
        });
    }
}

export class PVC {
    constructor(ns, name) {
        this.namespace = ns;
        this.name = name;
    }
}
