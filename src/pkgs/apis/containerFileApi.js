import axios from "axios";

export class ContainerFileApi {
  constructor(container) {
    this.container = container;
  }

  bind() {
    return new Promise((resolve, reject) => {
      let url = `/api/v1/container/bind/${this.container.id}`;
      axios.get(url)
        .then(response => {
          resolve(response.data);
        }).catch(error => {
        reject(error);
      });
    });
  }

  downloadUrl(...paths) {
    return `/api/v1/container/download/${this.container.id}/?p=${paths.map(v => encodeURIComponent(v)).join("&p=")}`;
  }

  show(path, dirOnly) {
    return new Promise((resolve, reject) => {
      let url = `/api/v1/container/show/${this.container.id}/${encodeURIComponent(path)}${dirOnly ? "?dirOnly=true" : ""}`;
      axios.get(url).then(response => {
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
      let url = `/api/v1/container/uncompress/${this.container.id}/${encodeURIComponent(path)}`;
      axios.put(url, `dest=${encodeURIComponent(dest)}`).then(response => {
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
      let url = `/api/v1/container/move/${this.container.id}/${encodeURIComponent(path)}`;
      axios.patch(url, `dest=${encodeURIComponent(dest)}`).then(response => {
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
    console.log(destPath, localFiles);

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
      let url = `/api/v1/container/upload/${this.container.id}`;
      axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
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
      let url = `/api/v1/container/delete/${this.container.id}/?p=${paths.map(v => encodeURIComponent(v)).join("&p=")}`;
      axios.delete(url).then(response => {
        resolve(response.data);
      }).catch(error => {
        reject(error);
      });
    });
  }
}

export class DockerContainer {
  constructor(id) {
    this.id = id;
  }
}
