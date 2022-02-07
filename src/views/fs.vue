<template>
  <a-layout id="fs-view" style="min-height: 100vh">
    <a-layout-content>
      <div style="width: 96%; height: 95vh; margin: auto;background-color: #454545">
        <a-layout style="background: #fff; padding: 0 12px 4px 12px; height: 100%;">
          <a-layout-header
            :style="`background-color: #454545; line-height: 54px; height: 44px; padding: 0 0 0 287px`">
            <div style="display: inline-block;">
              <a-button title="后退" type="primary" size="default" shape="circle"
                        :disabled="!rfe.bounded || rfe.dirBackHistory.length==0"
                        @click="goBack()">
                <template #icon>
                  <LeftOutlined/>
                </template>
              </a-button>
              <a-button title="前进" type="primary" size="default" shape="circle"
                        :disabled="!rfe.bounded || rfe.dirForwardHistory.length==0"
                        @click="goForward()" style="margin-left: 5px">
                <template #icon>
                  <RightOutlined/>
                </template>
              </a-button>
              <a-button title="上一级目录" type="primary" size="default" shape="circle"
                        :disabled="!rfe.bounded || rfe.currentDirPathNodes.length==0"
                        @click="goUp()" style="margin-left: 5px">
                <template #icon>
                  <UpOutlined/>
                </template>
              </a-button>
              <a-divider type="vertical" style="margin: 0 10px"/>

              <a-button title="批量下载已选择项" type="primary" size="default" shape="circle"
                        :disabled="!rfe.bounded" @click="batchDownload()">
                <template #icon>
                  <DownloadOutlined/>
                </template>
              </a-button>
              <a-button title="批量删除已选择项" type="primary" size="default" shape="circle"
                        :disabled="!rfe.bounded" @click="batchRemove()" style="margin-left: 5px">
                <template #icon>
                  <DeleteOutlined/>
                </template>
              </a-button>
              <a-divider type="vertical" style="margin: 0 10px"/>

              <a-upload name="file" :showUploadList="false" :before-upload="beforeUpload" multiple/>
              <a-button title="上传文件" type="primary" size="default" shape="circle" :disabled="!rfe.bounded"
                        @click="uploadBtnClick(false)">
                <template #icon>
                  <UploadOutlined/>
                </template>
              </a-button>
              <a-upload name="directory" :showUploadList="false" :before-upload="beforeUpload" directory
                        multiple/>
              <a-button title="上传文件夹" type="primary" size="default" shape="circle"
                        :disabled="!rfe.bounded" @click="uploadBtnClick(true)"
                        style="margin-left: 5px">
                <template #icon>
                  <CloudUploadOutlined/>
                </template>
              </a-button>
              <a-divider type="vertical" style="margin: 0 10px"/>

              <a-button title="刷新" type="primary" size="default" shape="circle" :disabled="!rfe.bounded"
                        @click="refresh()">
                <template #icon>
                  <RedoOutlined/>
                </template>
              </a-button>
            </div>
          </a-layout-header>
<!--          <a-divider style="margin: 0 0 6px 0"/>-->
          <a-layout-content :style="{ padding: '0 12px 0 0', minHeight: '280px', overflow: 'auto', backgroundColor: '#454545' }">
            <s-table :columns="this.table.listView.columns" :pagination="false"
                     :custom-row="customRow"
                     :custom-header-cell="customRow"
                     :data-source="this.rfe.currentFiles">
              <template #bodyCell="rowData">
                <template v-if="rowData.column.dataIndex === 'name'">
                  <a-button type="link" @click="show(rowData.record)" size="large" style="color: white">
                    <template v-if="rowData.record.isDir">
                      <FolderOpenOutlined/>
                    </template>
                    <template v-else>
                      <FileOutlined/>
                    </template>
                    {{ rowData.text }}
                  </a-button>
                </template>
                <template v-else-if="rowData.column.dataIndex === 'action'">
                  <a-space>
                    <a-button type="primary" title="下载" @click="download(rowData.record)" shape="round">
                      <template #icon>
                        <DownloadOutlined/>
                      </template>
                    </a-button>
                    <a-button type="primary" title="删除" @click="remove(rowData.record)" shape="round">
                      <template #icon>
                        <DeleteOutlined/>
                      </template>
                    </a-button>
                  </a-space>
                </template>
                <template v-else>{{ rowData.text }}</template>
              </template>
            </s-table>
          </a-layout-content>
        </a-layout>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script>
import {ContainerFileApi, DockerContainer, FileApi} from "@/pkgs/apis";
import RemoteFileExplorer, {Events, NEW_FILE_CONFLICT_POLICY} from "@/pkgs/explorer/RemoteFileExplorer";
import util from "@/utils";
import {viewableFileExts, viewableFileNames, viewableImageExts} from "@/utils/viewableFile";
import {
  RightOutlined,
  LeftOutlined,
  UpOutlined,
  DownloadOutlined,
  DeleteOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  RedoOutlined,
  FolderOpenOutlined,
  FileOutlined
} from '@ant-design/icons-vue';


export default {
  name: "fs",
  components: {
    RightOutlined,
    LeftOutlined,
    UpOutlined,
    DownloadOutlined,
    DeleteOutlined,
    UploadOutlined,
    CloudUploadOutlined,
    RedoOutlined,
    FolderOpenOutlined,
    FileOutlined
  },
  data() {
    return {
      cid: '',
      rfe: {},
      container: {},
      fileList: [],
      table: {
        isLoading: false,
        listView: {
          columns: [
            {
              title: '名称',
              width: 400,
              dataIndex: 'name',
              autoHeight: true,
              ellipsis: true,
            },
            {
              title: '大小',
              width: 100,
              dataIndex: 'readableSize',
            },
            {
              title: '修改时间',
              width: 180,
              dataIndex: 'readableModTime',
            },
            {
              title: '操作',
              width: 120,
              dataIndex: 'action',
            },
          ],
          rowSelection: {
            columnWidth: 50,
            selectedRowKeys: [],
            onChange: this.listSelectChange
          }
        },
      },
      fileViewer: {
        visible: false,
        loading: false,
        content: '',
        imageUrl: '',
        file: null,
        ready(file) {
          this.content = "";
          this.imageUrl = "";
          this.visible = true;
          this.loading = true;
          this.file = file;
        },
        show(content) {
          this.imageUrl = "";
          this.visible = true;
          this.loading = false;
          this.content = content;
        },
        showImage(url) {
          this.content = "";
          this.visible = true;
          this.loading = false;
          this.imageUrl = url;
        },
        close() {
          this.visible = false;
          this.loading = false;
          this.content = "";
          this.imageUrl = "";
          this.file = null;
        }
      },
      fileUploader: {
        uploading: false,
        visible: false,
        conflictPolicy: NEW_FILE_CONFLICT_POLICY.OVERRIDE,
        uploadFiles: [],
        addFile(localFile) {
          this.uploadFiles.push(localFile);
        },
        // 移除
        removeFile(localFile) {
          let index = this.uploadFiles.indexOf(localFile);
          if (index > -1) {
            this.uploadFiles.splice(index, 1);
          }
          if (this.uploadFiles.length == 0) {
            this.uploading = false;
          }
        },
        // 清除
        clearFiles() {
          this.uploadFiles = [];
          this.uploading = false;
        },
        setConflictPolicy(conflictPolicy) {
          this.conflictPolicy = conflictPolicy;
        },
        hasUploadFile() {
          return this.uploadFiles.length > 0;
        },
        show() {
          this.visible = true;
        },
        close() {
          this.visible = false;
        }
      },
    };
  },
  created() {
    this.cid = this.$route.params.cid;
    if (!this.cid) {
      // 失败处理
    }
    this.$watch(
      () => this.$route.params,
      (toParams, previousParams) => {
        console.log(toParams);
      }
    );
    this.container = new DockerContainer(this.cid);
    this._bindContainer();
  },
  methods: {
    customRow(record, index){
      return {
        style: {
          background: '#454545',
          color: 'white',
          fontSize: 'larger',
        },
      };
    },
    debugNameSlotProps(props) {
      console.log(props);
    },
    _bindContainer() {
      let _this = this;
      this.rfe = new RemoteFileExplorer(new ContainerFileApi(this.container));
      this.rfe.bindContainer().then(() => {
        _this._listdir();
      }).catch(error => {
        if (error.response) {
          _this.$message.error('绑定失败：' + error.response.data);
        } else {
          _this.$message.error('绑定失败：' + error.message);
        }
      });
    },
    // 重置为绑定pvc前的状态
    _reset() {
      this.fileUploader.clearFiles();
      this.pvc.namespace = "";
      this.pvc.name = "";
      this.rfe.unbind();
    },

    _listdir() {
      let _this = this;
      this.rfe.listDir("/").then(files => {
        _this.fileList = files;
        // _this.pathList.push(
        //   {
        //     path: '/',
        //     breadcrumbName: 'home',
        //   }
        // );
      }).catch(error => {
        _this.$message.error('获取文件列表失败：' + error.message);
      });
    },

    show(file) {
      if (file.isDir) {
        this.__showDir(file.path);
      } else {
        let lowerFileName = file.name.toLowerCase();
        let ext = this.parseFileName(lowerFileName).ext;
        if (viewableImageExts.includes(ext)) {
          this.__showImageFile(file);
          return;
        }
        if (!viewableFileNames.includes(lowerFileName) && !viewableFileExts.includes(ext)) {
          let self = this;
          this.$confirm({
            title: '不支持预览',
            content: `文件【${file.name}】暂不支持在线预览，请您下载后查看！`,
            okText: '下载',
            cancelText: '取消预览',
            onOk() {
              // 下载
              self.download(file);
            },
            onCancel() {
            }
          });
        } else {
          let fileSizeLimit = 1 * 1024 * 1024;
          if (file.size >= fileSizeLimit) {
            let self = this;
            this.$confirm({
              title: '是否下载查看',
              content: '在线查看过大文件（>=' + util.bytesCountToHumanReadable(fileSizeLimit) + '）将导致浏览器响应缓慢，建议您下载后查看！',
              okText: '下载',
              cancelText: '取消查看',
              onOk() {
                // 下载
                self.download(file);
              },
              onCancel() {
              }
            });
          } else {
            this.__showFileContent(file);
          }
        }
      }
    },
    __showDir(path) {
      let _this = this;
      this.rfe.listDir(path)
        .then(files => {
          this.fileList = files;
          // this.pathList.push(
          //   {
          //     path: '/',
          //     breadcrumbName: 'home',
          //   }
          // );
        }).catch(error => {
        if (error.response) {
          _this.$message.error('获取文件列表失败：' + error.response.data);
        } else {
          _this.$message.error('获取文件列表失败：' + error.message);
        }
      });
    },
    __showFileContent(file) {
      this.fileViewer.ready(file);
      this.rfe.getFileContent(file.path)
        .then(content => {
          this.fileViewer.show(content);
        }).catch(error => {
        if (error.response) {
          error.message = error.response.data;
        }
        this.fileViewer.show('获取信息失败，请刷新后重试：' + error.message);
        this.$message.error('获取信息失败，请刷新后重试！');
      });
    },
    __showImageFile(file) {
      this.fileViewer.ready(file);
      try {
        let url = this.rfe.getFileDownloadUrl(file.path);
        this.fileViewer.showImage(url);
      } catch (e) {
        this.$message.error(e.message);
      }
    },
    // 批量下载
    batchDownload() {
      let selection = this.listView.rowSelection.selectedRowKeys;
      if (selection.length == 0) {
        this.$message.warning('您还没有选择文件！');
      } else {
        this.download(...this.rfe.selection.fileList, ...this.rfe.selection.dirList);
      }
    },
    // 下载
    download(...files) {
      let alink = document.createElement('a');
      try {
        alink.href = this.rfe.getFileDownloadUrl(...files.map(r => r.key));
        alink.click();
      } catch (e) {
        this.$message.error(e.messages);
      } finally {
        return false;
      }
    },
    // 批量删除
    batchRemove() {
      let selection = this.listView.rowSelection.selectedRowKeys;
      if (selection.length == 0) {
        this.$message.warning('您还没有选择文件！');
      } else {
        this.remove(...this.rfe.selection.dirList, ...this.rfe.selection.fileList);
      }
    },
    // 删除
    remove(...files) {
      let fileNames = files.map(f => {
        return f.isDir ?
          this.$createElement("li", {}, [this.$createElement("span", {style: {"color": "#9e9e9e"}}, "[DIR ] "), this.$createElement("strong", f.name)]) :
          this.$createElement("li", {}, [this.$createElement("span", {style: {"color": "#9e9e9e"}}, "[FILE] "), f.name]);
      });
      let self = this;
      this.$confirm({
        title: '文件(夹)删除后无法找回，您确认要删除这' + (files.length > 1 ? files.length : '') + '个文件(夹)吗？',
        content: (h) => h('ol', {
          style: {
            'max-height': '200px',
            "overflow": "auto",
            "border-style": "dotted",
            "border-width": "1px 0"
          }
        }, fileNames),
        width: 510,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
          self.rfe.remove(...files.map(r => r.key));
        }
      });
    },
    // 开始重命名UI
    renaming(file) {
      let isGridView = false;
      let inputEl;
      if (isGridView) {
        inputEl = document.getElementById(file.key + "_grid-view-renaming-input");
      } else {
        inputEl = document.getElementById(file.key + "_renaming-input");
        inputEl.style.width = (document.getElementById(`${file.key}_name-span`).offsetWidth + 32) + "px";
      }
      file.renaming = true;
      let fileName = file.name;
      setTimeout(() => { // 输入框显示出来后将光标定位到输入框
        let selectEnd = file.isDir ? fileName.length : fileName.lastIndexOf(".");
        util.setCursorPosition(inputEl, 0, selectEnd);
      }, 80);
    },
    // 重命名
    rename(file, event) {
      // console.dir(event)
      // console.log(file.renaming)
      if (!file.renaming) { // 避免回车和失去焦点事件重复触发重命名
        return;
      }
      let isGridView = this.showMode === 'grid';
      let newName = (isGridView ? event.target.innerText : event.target.value).trim();
      if (newName && file.name !== newName) {
        let newPath = file.path.substring(0, file.path.lastIndexOf(file.name)) + newName;
        let _self = this;
        this.rfe.move(file.path, newPath)
          .then(() => {
            _self.refresh();
            this.$message.success(`重命名成功: [${file.name} -> ${newName}]`);
          })
          .catch(error => {
            if (error.response) {
              error.message = error.response.data;
            }
            this.$message.error(`重命名失败[${file.name} -> ${newName}]：${error.message}`);
          });
      }
      file.renaming = false;
    },
    // 监听重命名输入框，输入回车时触发重命名
    onRenameKeydown(file, event) {
      if (event.keyCode == 13) { // 回车确认
        this.rename(file, event);
        return false;
      } else if (event.keyCode == 27) { // ESC 放弃
        file.renaming = false;

        let isGridView = this.showMode === 'grid';
        if (isGridView) { // 还原输入框中编辑后的名字
          event.target.innerText = file.name;
        }
        return false;
      }
      return true;
    },
    goPathNode(pathNodeIndex) {
      let goPath = this.rfe.currentDirPathNodes.slice(0, pathNodeIndex + 1).join("/");
      this.__showDir(goPath);
    },
    refresh() {
      this.rfe.refresh()
        .then(files => {
          this.fileList = files;
        }).catch(error => {
        if (error.response) {
          error.message = error.response.data;
        }
        this.$message.error('获取文件列表失败：' + error.message);
      });
    },
    goBack() {
      this.rfe.goBack()
        .catch(error => {
          if (error.response) {
            error.message = error.response.data;
          }
          this.$message.error('获取文件列表失败：' + error.message);
        });
    },
    goForward() {
      this.rfe.goForward()
        .catch(error => {
          if (error.response) {
            error.message = error.response.data;
          }
          this.$message.error('获取文件列表失败：' + error.message);
        });
    },
    goUp() {
      this.rfe.goUp()
        .catch(error => {
          if (error.response) {
            error.message = error.response.data;
          }
          this.$message.error('获取文件列表失败：' + error.message);
        });
    },
    uploadBtnClick(isDir) {
      if (!this.fileUploader.hasUploadFile()) {
        let fileSelector = null;
        document.querySelectorAll("input[type=file]").forEach(e => {
          if ((!isDir && !e.directory && !e.webkitdirectory) ||
            (isDir && (e.directory || e.webkitdirectory))) {
            fileSelector = e;
          }
        });
        if (fileSelector) {
          fileSelector.click();
        }
      } else {
        this.fileUploader.show();
      }
    },
    beforeUpload(file) {
      // console.dir(file)
      let hasSelected = false;
      file.localRelativePath = file.relativePath || file.webkitRelativePath;
      if (!file.localRelativePath) {
        file.localRelativePath = file.name;
      }
      this.fileUploader.uploadFiles.forEach((f, i) => {
        if (f.localRelativePath === file.localRelativePath) {
          this.fileUploader.uploadFiles[i] = file;
          hasSelected = true;
        }
      });
      if (!hasSelected) {
        this.fileUploader.addFile(file);
      } else {
        this.$message.warning('已过滤重复选择的文件：' + file.localRelativePath);
      }
      file.uploadStatus = 0;
      this.fileUploader.show();
      return false;
    },
    // 开始上传
    upload() {
      this.fileUploader.uploading = true;
      this.rfe.uploadFiles(this.rfe.currentDir, this.fileUploader.conflictPolicy, ...this.fileUploader.uploadFiles)
        .then(data => {
          console.log("上传完成：" + data);
          this.$message.success('上传成功');
          this.refresh();
        })
        .catch(error => {
          console.log(error);
          this.fileUploader.uploading = false;
          this.$message.error('上传失败');
        });
    },
    uncompress(file, destRelativePath) {
      let dest = this.rfe.currentDir;
      if (destRelativePath) {
        dest += "/" + destRelativePath;
      }
      this.rfe.uncompress(file.path, dest)
        .then(content => {
          this.$message.success('解压完成');
          this.refresh();
          console.log(content);
        }).catch(err => {
        this.$message.error('解压失败：' + err.message);
      });
    },
    parseFileName(fileName) {
      let name, ext;
      let lastDotIndex = fileName.lastIndexOf(".");
      if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
        name = fileName;
        ext = "";
      } else {
        name = fileName.substring(0, lastDotIndex);
        ext = fileName.substring(lastDotIndex + 1);
      }
      return {name, ext};
    },
    feedback() {
      const h = this.$createElement;
      this.$info({
        title: '关于',
        content: h('div', {}, [
          h('p', '数据卷浏览器 v1.0.0'),
          h('p', ''),
          h('p', '任何问题或建议请CoCall反馈给[arterydocker支持]，我们将持续完善此工具。'),
        ]),
        onOk() {
        },
      });
    },
    // 切换显示模式
    toggleShowMode() {
      this.showMode = this.showMode === 'list' ? 'grid' : 'list';
      localStorage.setItem("ARTERYDOCKER-PVC-EXPLORER-MY-SHOWMODE", this.showMode);
    },
    // grid模式 选择
    gridSelectChange(file) {
      // console.dir(file)
      if (file.selected) {
        this.rfe.unselectFile(file.key);
        let index = this.listView.rowSelection.selectedRowKeys.indexOf(file.key);

        if (index > -1) {
          this.listView.rowSelection.selectedRowKeys.splice(index, 1);
        }
      } else {
        this.rfe.selectFile(file.key);
        this.listView.rowSelection.selectedRowKeys.push(file.key);
      }
    },
    // list模式 选择
    listSelectChange(selectedRowKeys, selectedRows) {
      // 表格选择
      // console.log(JSON.stringify(selectedRowKeys), JSON.stringify(selectedRows));
      this.listView.rowSelection.selectedRowKeys = selectedRowKeys;
      this.rfe.currentFiles.forEach((f) => {
        if (selectedRows.includes(f)) {
          this.rfe.selectFile(f.key);
        } else {
          this.rfe.unselectFile(f.key);
        }
      });
    },
    // 清空list模式选择（list模式选择状态不会自动清空）
    clearSelect() {
      this.listSelectChange([], []);
    },
    getIconName(file, isFolderOpened) {
      return file.isDir ? fileIcons.getDefaultFolderIconName(isFolderOpened) : fileIcons.getFileIconName(file.name);
    },
    getDefaultFolderIconName(opened) {
      return fileIcons.getDefaultFolderIconName(opened);
    },
    getEllipsisFileName(file, width) {
      return file.gridEllipsisFileName ? file.gridEllipsisFileName : file.gridEllipsisFileName = util.getEllipsisString(file.name, width);
    },

    // function(selectedKeys, e:{selected: bool, selectedNodes, node, event})
    onTreeSelect(selectedKeys, event) {
      // console.dir(selectedKeys)
      // console.dir(event)
      if (!event.selected) {
        return;
      }
      this.__showDir(event.node.dataRef.key);
    },

    // function(expandedKeys, {expanded: bool, node})
    onTreeExpand(expandedKeys, event) {
      if (event.expanded) {
        event.node.dataRef.slots.icon = 'folder-opened';
      } else {
        event.node.dataRef.slots.icon = 'folder';
      }
      console.dir(expandedKeys);
      console.dir(event);

      this.rfe.listDir(event.node.dataRef.key, true).then(dirs => {
        event.node.dataRef.children = dirs.map(f => {
          return {"key": f.key, "title": f.name, children: [], isLeaf: false, slots: {icon: 'folder'}};
        });
      }).catch(error => {
        if (error.response) {
          error.message = error.response.data;
        }
        this.$message.error('展开文件夹出错：' + error.message);
      });
    }
  }
};
</script>
<style>
body {
  min-width: 960px;
  overflow-y: hidden;
}

#app .logo {
  font-size: x-large;
  color: aliceblue;
}

#app .login {
  margin: 13px 0 16px 0;
  float: right;
}

#app .icon {
  margin: 0 15px 15px 0;
  font-size: 25px;
  color: steelblue;
}

#app .feedback {
  margin-top: 7px;
  font-size: 25px;
  color: steelblue;
}

#app .file {
  color: rgba(0, 0, 0, 0.65);
}

#app .file:hover {
  color: #1890ff;
  text-decoration: underline;
}

#app .renaming-input {
  min-width: 150px;
  max-width: 340px;
  border: 1px solid #40A9FF;
  border-radius: 4px;
  height: 28px;
  padding: 2px 6px;
  background: lightyellow;
  position: relative;
  z-index: 10;
}

.ant-upload-list-picture-card .ant-upload-list-item {
  float: left;
  width: 82px;
  /* height: 94px; */
  margin: 0 8px 8px 0;
}

.ant-upload-list-picture .ant-upload-list-item, .ant-upload-list-picture-card .ant-upload-list-item {
  position: relative;
  /* height: 66px; */
  /* padding: 8px; */
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

#grid-view .ant-upload-list-picture-card .ant-upload-list-item {
  position: relative;
  /* min-height: 120px; */
  margin-bottom: 20px;
  /* padding: 0px 0px 16px 0px; */
  border-radius: 4px;
  /*border: 1px solid #fff;*/
  text-align: center;
}

/*#grid-view .ant-upload-list-picture-card .ant-upload-list-item:hover {*/
/*  background: #E6F0FF;*/
/*}*/

#grid-view .ant-upload-list-item-info {
  height: 80%;
  padding: 12px 12px 0 4px;
  -webkit-transition: background-color 0.3s;
  transition: background-color 0.3s;
}

#grid-view .ant-checkbox {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  font-variant: tabular-nums;
  line-height: 1.5;
  list-style: none;
  -webkit-font-feature-settings: 'tnum';
  font-feature-settings: 'tnum';
  display: inline-block;
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  outline: none;
  cursor: pointer;
  position: absolute;
  left: 0;
  top: 1px;
}

.grid-view-renaming-input {
  /* min-width: 150px;
  max-width:340px;  */
  border: 1px solid #40A9FF;
  border-radius: 4px;
  /* height: 28px;  */
  padding: 2px 6px;
  background: lightyellow;
  position: relative;
  z-index: 10;
}
</style>
