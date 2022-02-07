import util from "@/utils";

/**
 * 将文件列表转换为可显示文件列表
 * @param {*} fileList
 * @returns
 */
function convertToShowFileList(fileList) {
  fileList.forEach(f => {
    f.readableSize = f.isDir ? "" : util.bytesCountToHumanReadable(f.size);
    f.readableModTime = new Date(f.modTime * 1000).toLocaleString();

    makeObjectReadonly(f);

    f.selected = false;
    f.renaming = false;
  });
  return fileList;
}

/**
 * 使对象只读
 * @param {*} obj
 */
function makeObjectReadonly(obj) {
  for (let k in obj) {
    Object.defineProperty(obj, k, {
      configurable: false,
      writable: false
    });
  }
}

const PVC_MODE = 'pvc';
const CONTAINER_MODE = 'pod';
const ROOT_PATH_NAME = "/";
// 冲突处理策略
export const NEW_FILE_CONFLICT_POLICY = {
  "SKIP": "skip",
  "OVERRIDE": "override",
  "KEEP_BOTH": "keep_both"
};
// 可监听事件
export const Events = {
  // BOUNDED: "bounded",
  // BEFORE_UNBIND: "before-unbind",
  // UNBOUNDED: "unbounded",
  BEFORE_LIST_DIR: "before-list-dir",
  LIST_DIR: "list-dir",
  UPLOAD_START: "upload-loadstart",
  UPLOAD_PROGRESS: "upload-progress",
  UPLOAD_ABORT: "upload-abort",
  UPLOAD_ERROR: "upload-error",
  UPLOAD_TIMEOUT: "upload-timeout"
};

/**
 * 文件浏览器
 */
class RemoteFileExplorer {
  constructor(containerFileApi) {
    // 容器文件系统管理API
    this.containerFileApi = containerFileApi;
    // pvc 或 pod，  pvc 获取本地或nfs文件系统，pod获取pod内部的容器文件系统
    this.workMode = '';
    this.pvc = {};
    this.pod = {};
    this.bounded = false;
    // 可后退历史记录
    this.dirBackHistory = [];
    // 可前进历史记录
    this.dirForwardHistory = [];
    this.currentDir = undefined;
    this.currentDirPathNodes = [];
    this.currentFiles = [];
    this.currentFilesMap = {};
    this.selection = {
      fileList: [],
      dirList: [],
      hasDir: false,
      totalSize: 0,
      readableTotalSize: '0 B',
      clear() {
        this.fileList = [];
        this.dirList = [];
        this.totalSize = 0;
        this.readableTotalSize = '0 B';
      }
    };
    // 事件监听器
    this.eventListeners = {};
  }

  /**
   * 注册事件监听器
   * @param {stirng} eventName
   * @param {Function} listener
   */
  addEventListener(eventName, listener) {
    let lsnrs = this.eventListeners[eventName];
    if (!lsnrs) {
      lsnrs = this.eventListeners[eventName] = [];
    }
    lsnrs.push(listener);
  }

  // 移除事件监听器
  removeEventListener(eventName, listener) {
    let lsnrs = this.eventListeners[eventName];
    if (!lsnrs) {
      let index = lsnrs.indexOf(listener);
      if (index > -1) {
        lsnrs.splice(index, 1);
      }
    }
  }

  // 触发事件
  _emit(eventName, ...args) {
    let lsnrs = this.eventListeners[eventName];
    if (lsnrs) {
      lsnrs.forEach((l) => {
        l.call(this, ...args);
      });
    }
  }

  remoteApi() {
    return this.containerFileApi;
  }

  // 绑定 pod
  bindContainer() {
    return new Promise((resolve, reject) => {
      this.containerFileApi.bind().then((resp) => {
        this.workMode = CONTAINER_MODE;
        this.bounded = true;
        console.log(`绑定成功 container=${this.containerFileApi.container.id}`);
        resolve();
      }).catch(error => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error(error.response.data);
          console.error(error.response.status);
          console.error(error.response.headers);
        }
        console.error(`绑定失败 container=${this.containerFileApi.container.id}`);
        reject(error);
      });
    });
  }

  // 绑定pvc
  bindPvc() {
    return new Promise((resolve, reject) => {
      this.remoteFileApi.bind().then(() => {
        this.workMode = PVC_MODE;
        this.bounded = true;
        console.log(`绑定成功：ns=${this.remoteFileApi.pvc.namespace}, pvc=${this.remoteFileApi.pvc.name}`);
        resolve();
      }).catch(error => {
        console.error(error);
        reject(error);
      });
    });
  }

  // 与绑定的pvc解绑
  unbind() {
    if (!this.bounded) {
      return;
    }
    this.pvc = undefined;
    this.dirBackHistory = [];
    this.dirForwardHistory = [];
    this.currentDir = undefined;
    this.currentDirPathNodes = [];
    this.currentFiles = [];
    this.currentFilesMap = {};
    this.selection.clear();

    this.bounded = false;
  }

  // 检查是否已绑定pvc
  _checkBound() {
    if (!this.bounded) {
      throw new Error("未绑定");
    }
  }

  // 选中文件
  selectFile(key) {
    let file = this.currentFilesMap[key];
    if (file && !file.selected) {
      file.selected = true;
      if (file.isDir) {
        this.selection.dirList.push(file);
      } else {
        this.selection.fileList.push(file);
        this.selection.totalSize += file.size;
        this.selection.readableTotalSize = util.bytesCountToHumanReadable(this.selection.totalSize);
      }
    }
  }

  // 取消选中文件
  unselectFile(key) {
    let file = this.currentFilesMap[key];
    if (file && file.selected) {
      file.selected = false;
      if (file.isDir) {
        let index = this.selection.dirList.indexOf(file);
        if (index > -1) {
          this.selection.dirList.splice(index, 1);
        }
      } else {
        let index = this.selection.fileList.indexOf(file);
        if (index > -1) {
          this.selection.fileList.splice(index, 1);
        }

        this.selection.totalSize -= file.size;
        this.selection.readableTotalSize = util.bytesCountToHumanReadable(this.selection.totalSize);
      }
    }
  }

  // ls dir
  listDir(path, dirOnly, skipHistory) {
    this._checkBound();
    if (!path) {
      path = ROOT_PATH_NAME;
    }

    return new Promise((resolve, reject) => {
      this.remoteApi().show(path, dirOnly).then(files => {
        // 历史
        if (!skipHistory && (this.dirBackHistory.length == 0 || this.currentDir !== this.dirBackHistory[this.dirBackHistory.length - 1])) {
          if (this.currentDir !== undefined && this.currentDir !== path) {
            this.dirBackHistory.push(this.currentDir);
          }
        }
        // 最多32个历史路径
        if (this.dirBackHistory.length > 32) {
          this.dirBackHistory.shift();
        }

        this.currentDir = path;
        this.currentDirPathNodes = path.split("/").filter(s => {
          return !!s;
        });
        this.currentFiles = convertToShowFileList(files);
        this.currentFilesMap = {};
        this.currentFiles.forEach((v) => {
          this.currentFilesMap[v.key] = v;
        });
        this.selection.clear();

        this._emit(Events.BEFORE_LIST_DIR, path);
        resolve(this.currentFiles, path);
        this._emit(Events.LIST_DIR, this.currentFiles, path);
      }).catch(error => {
        console.error(error);
        reject(error, path);
      });
    });
  }

  // 刷新
  refresh() {
    this._checkBound();

    return this.listDir(this.currentDir);
  }

  // 上一级目录
  goUp() {
    this._checkBound();

    let pathNode = this.currentDirPathNodes;
    // 已经在根目录
    if (pathNode.length == 0) {
      return;
    }
    let path = pathNode.slice(0, pathNode.length - 1).join("/");

    return this.listDir(path);
  }

  // 后退
  goBack() {
    this._checkBound();

    if (this.dirBackHistory.length == 0) {
      return new Promise();
    }
    let path = this.dirBackHistory.pop();
    this.dirForwardHistory.push(this.currentDir);
    return this.listDir(path, true);
  }

  //  前进
  goForward() {
    this._checkBound();

    if (this.dirForwardHistory.length == 0) {
      return new Promise();
    }
    let path = this.dirForwardHistory.pop();
    return this.listDir(path);
  }

  // 获取文件内容
  getFileContent(path) {
    this._checkBound();

    return new Promise((resolve, reject) => {
      this.remoteApi().show(path).then(content => {
        resolve(content);
      }).catch(error => {
        console.error(error);
        reject(error);
      });
    });
  }

  // 获取文件或目录下载地址
  getFileDownloadUrl(...path) {
    this._checkBound();
    return this.remoteApi().downloadUrl(...path);
  }

  // 删除文件或目录
  remove(...paths) {
    this._checkBound();

    return new Promise((resolve, reject) => {
      // 排除掉当前目录及当前目录的上级目录
      paths = paths.filter(v => !this.currentDir.startsWith(v));
      if (paths.length == 0) {
        resolve();
        return;
      }
      this.remoteApi().delete(...paths).then(() => {
        this.refresh().then(files => {
          resolve(files);
        }).catch(error => {
          console.error(error);
          reject(error);
        });
      }).catch(error => {
        console.error(error);
        reject(error);
      });
    });
  }

  // 上传文件
  uploadFiles(targetPath, conflictPolicy, ...localFiles) {
    this._checkBound();

    // UPLOAD_START: "upload-loadstart",
    // UPLOAD_PROGRESS: "upload-progress",
    // UPLOAD_ABORT: "upload-abort",
    // UPLOAD_ERROR: "upload-error",
    // UPLOAD_TIMEOUT: "upload-timeout"

    let rfe_self = this;
    let promises = localFiles.map(f => {
      let onProgressEvent = progressEvent => {
        let progress = Math.floor(progressEvent.loaded / progressEvent.total * 100 | 0);
        rfe_self._emit(Events.UPLOAD_PROGRESS, f, progress);
      };
      return this.remoteApi().upload(onProgressEvent, targetPath,
        conflictPolicy || NEW_FILE_CONFLICT_POLICY.KEEP_BOTH, f);
    });

    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then(datas => {
          resolve(datas);
        }).catch(error => {
        console.error(error);
        reject(error);
      });
    });
  }

  // 解压文件
  uncompress(filePath, dest) {
    this._checkBound();

    return new Promise((resolve, reject) => {
      this.remoteApi().uncompress(filePath, dest).then(content => {
        resolve(content);
      }).catch(error => {
        console.error(error);
        reject(error);
      });
    });
  }

  // 移动
  move(filePath, dest) {
    this._checkBound();

    return new Promise((resolve, reject) => {
      this.remoteApi().move(filePath, dest).then(content => {
        resolve(content);
      }).catch(error => {
        console.error(error);
        reject(error);
      });
    });
  }
}

export default RemoteFileExplorer;
