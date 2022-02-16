<template>
  <div>
    <a-row class="single-row">
      <a-col :span="4" :title="'容器名称: ' + name" style="width: 100%">
        <div class="row-content" style="text-align: center">
          <a>
            <span class="overflow-hidden">{{ name }}</span>
          </a>
        </div>
      </a-col>
      <a-col :span="2" :title="'容器状态 ' + name" style="width: 100%">
        <div class="row-content" style="text-align: center">
          <a>
            <span class="overflow-hidden" :class="this.containerInfo.State === 'running'?'span-green':'span-red'">
              {{ this.containerInfo.State }}
            </span>
          </a>
        </div>
      </a-col>
      <a-col :span="6">
        <div class="row-content" style="text-align: center" :title="'容器镜像: ' + containerInfo.Image">
          <a>
            <span class="overflow-hidden">{{ containerInfo.Image }}</span>
          </a>
        </div>
      </a-col>
      <a-col :span="6">
        <a-space>
          <a-button type="text" style="width: 150px">
            <span :class="cpuClass"><span>CPU:  </span>{{ cpuUsageCore }} &nbsp;&nbsp; {{ cpuUsagePercent }}</span>
          </a-button>
          <a-button type="text" style="width: 150px">
            <span :class="memClass"><span>内存:  </span>{{ memUsageMb }} &nbsp;&nbsp; {{ memUsagePercent }}</span>
          </a-button>
        </a-space>
      </a-col>
      <a-col :span="6">
        <a-space>
          <a-button type="primary" shape="round" size="middle" title="启动" @click.stop="containerStart">
            <template #icon>
              <PlayCircleOutlined/>
            </template>
          </a-button>
          <a-button type="primary" shape="round" size="middle" title="停止" @click.stop="containerStop">
            <template #icon>
              <PauseCircleOutlined/>
            </template>
          </a-button>
          <a-button type="primary" shape="round" size="middle" title="浏览文件" @click.stop="gotoContainerFs">
            <template #icon>
              <AntCloudOutlined/>
            </template>
          </a-button>
          <a-button type="primary" shape="round" size="middle" title="浏览日志" @click.stop="containerLogs">
            <template #icon>
              <FileSearchOutlined/>
            </template>
          </a-button>
          <a-button type="primary" shape="round" size="middle" title="命令行调试" @click.stop="containerSsh">
            <template #icon>
              <CodeOutlined />
            </template>
          </a-button>
        </a-space>
      </a-col>
    </a-row>
    <a-modal
      v-model:visible="sshVisible"
      title="SSH"
      @ok="closeSsh"
      width="100%"
      :destroyOnClose="true"
      :keyboard="false"
      wrapClassName="full-modal"
    >
      <template #footer>
        <a-button type="primary" size="middle" title="关闭" @click.stop="closeSsh">关闭</a-button>
      </template>
      <ssh :containerInfo="this.containerInfo" @close="closeSsh"></ssh>
    </a-modal>
    <a-modal
      v-model:visible="logVisible"
      title="日志"
      @ok="closeLogs"
      width="100%"
      :destroyOnClose="true"
      wrapClassName="full-modal"
    >
      <template #footer>
        <a-button type="primary" size="middle" title="下载日志" @click.stop="containerLogsDownload">下载日志</a-button>
        <a-button type="primary" size="middle" title="关闭" @click.stop="closeLogs">关闭日志</a-button>
        <a-button type="primary" size="middle" title="刷新" @click.stop="containerLogsRefresh">刷新日志</a-button>
      </template>
      <div class="logContainer">
        <div class="log-msg" v-for="(msg, index) in logs" :key="index">
          <span class="line-number">&nbsp;&nbsp;{{ index }} &nbsp;&nbsp;</span>
          <span>{{ msg }}</span>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import containerResourceStats from '@/components/container/containerResourceStats';
import {
  AntCloudOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  FileSearchOutlined,
  CodeOutlined
} from '@ant-design/icons-vue';
import axios from "axios";
import {v4} from "uuid";
import util from "@/utils";
import {Terminal} from 'xterm';
import ssh from '@/components/container/ssh';

export default {
  name: "containerInfo",
  components: {
    // containerResourceStats
    AntCloudOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    FileSearchOutlined,
    CodeOutlined,
    ssh,
  },
  props: {
    containerInfo: Object,
  },
  data() {
    return {
      logs: [],
      logVisible: false,
      sshVisible: false,
      timer: {},
      stsData: {},
      memUsagePercent: '',
      memUsageMb: '',
      cpuUsagePercent: '',
      cpuUsageCore: '',
      cpuClass: '',
      memClass: '',
      msgTimeout: 3,
      currentSshContainerId: '',
    };
  },
  mounted() {
    console.log(this.containerInfo);
    this.getContainerStats();
    let _this = this;
    this.timer = setInterval(() => {
      _this.getContainerStats();
    }, 2000);
  },
  unmounted() {
    clearInterval(this.timer);
  },
  methods: {
    uuid() {
      return v4();
    },
    closeLogs() {
      this.logVisible = false;
    },
    closeSsh() {
      this.sshVisible = false;
    },
    gotoContainerFs() {
      console.log('gotoContainerFs');
      let url = `/fs/${this.containerInfo.Id}`;
      this.$router.push(url);
    },
    getContainerStats() {
      let _this = this;
      let url = '/api/v1/container/' + this.containerInfo.Id + '/stats';
      axios.get(url)
        .then(function (response) {
          _this.stsData = response.data;
        })
        .catch(function (error) {
          console.error(error);
          if (error.response.data) {
            _this.$message.error(error.response.data, 5);
          }
        });
    },
    containerStart() {
      let _this = this;
      this.$message.info(`已提交启动容器 ${_this.containerInfo.Id} 的请求`, this.msgTimeout);
      let url = `${util.v1Api()}/container/start/${this.containerInfo.Id}`;
      axios.post(url)
        .then(response => {
          console.log(response);
          this.$message.success(`启动容器 ${_this.containerInfo.Id} 成功`, this.msgTimeout);
        }).catch(error => {
        console.error(error);
        this.$message.error(`启动容器 ${_this.containerInfo.Id} 失败`, this.msgTimeout);
      });
    },
    containerStop() {
      let _this = this;
      this.$message.info(`已提交停止容器 ${_this.containerInfo.Id} 的请求`, this.msgTimeout);
      let url = `${util.v1Api()}/container/stop/${this.containerInfo.Id}`;
      axios.post(url)
        .then(response => {
          console.log(response);
          this.$message.success(`停止容器 ${_this.containerInfo.Id} 成功`, this.msgTimeout);
        }).catch(error => {
        console.error(error);
        this.$message.error(`停止容器 ${_this.containerInfo.Id} 失败`, this.msgTimeout);
      });
    },
    containerLogs() {
      console.log('container logs');
      this.logVisible = true;
      let _this = this;
      let url = `${util.v1Api()}/container/logs/${this.containerInfo.Id}`;
      axios.get(url)
        .then(response => {
          console.log(response);
          _this.logs = response.data.split("\n");
        }).catch(error => {
        console.error(error);
      });
    },
    containerSsh() {
      console.log('container logs');
      this.sshVisible = true;
      // this.$router.replace('/ssh');
    },
    containerLogsRefresh() {
      this.containerLogs();
    },
    containerLogsDownload() {
      console.log('container logs');
      this.logVisible = true;
      let _this = this;
      let url = `${util.v1Api()}/container/logs/${this.containerInfo.Id}?lines=all`;
      let alink = document.createElement('a');
      try {
        alink.href = url;
        alink.click();
      } catch (e) {
        this.$message.error(e.messages);
      } finally {
        return false;
      }
    },
    sshFinished() {
      console.log('ssh finished');
      this.sshVisible = false;
    },
  },
  watch: {
    stsData(newValue, oldValue) {
      try {
        if (this.containerInfo.State !== 'running') {
          this.memUsagePercent = '';
          this.memUsageMb = '';
          this.cpuUsagePercent = '';
          this.cpuUsageCore = '';
          return;
        }
        let memoryStats = newValue['memory_stats'];
        let memUsed = memoryStats.usage;
        if (memoryStats['stats']['cache']) {
          memUsed = memUsed - memoryStats['stats']['cache'];
        }
        // this.memUsageMb = Math.round(memUsed / 1000 / 1000) + 'MB';
        this.memUsageMb = (memUsed / 1000 / 1000).toFixed(2) + 'MB';
        let availableMem = memoryStats['limit'];
        let memP = Math.round(memUsed / availableMem * 100);
        if (memP > 75) {
          this.memClass = 'span-red';
        } else {
          this.memClass = 'span-green';
        }
        this.memUsagePercent = memP + '%';

        let cpuStats = newValue['cpu_stats'];
        let cpuDelta = cpuStats['cpu_usage']['total_usage'] - newValue['precpu_stats']['cpu_usage']['total_usage'];
        let systemCpuDelta = cpuStats['system_cpu_usage'] - newValue['precpu_stats']['system_cpu_usage'];
        let numberCpus = cpuStats['online_cpus'];
        if (!numberCpus) {
          numberCpus = cpuStats['cpu_usage']['percpu_usage'].length;
        }

        let cpuPercent = (cpuDelta / systemCpuDelta * 100 * numberCpus).toFixed(2);
        if (cpuPercent > 60) {
          this.cpuClass = 'span-red';
        } else {
          this.cpuClass = 'span-green';
        }
        this.cpuUsagePercent = cpuPercent + '%';
        // this.cpuUsageCore = Math.round(cpuPercent / 100 * numberCpus) + '核';
        this.cpuUsageCore = (cpuPercent / 100 * numberCpus).toFixed(3) + '核';
      } catch (e) {
        console.error(e);
      }
    },
    // logVisible(newV, oldV) {
    //   try {
    //
    //   } catch (e) {
    //     console.error(e);
    //   }
    // }
  },

  computed: {
    name() {
      let name = this.containerInfo.Names[0];
      if (name.charAt(0) === '/') {
        name = name.slice(1);
      }
      return name;
    },
  }
};
</script>

<!--此处不可使用scoped， 会导致modal 的全屏样式失效-->
<!--我们使用父组件的full-modal 类来限定此样式不会扩散-->
<style lang="less">
.logContainer {
  background-color: #454545;
  padding: 10px;
  white-space: pre-wrap;
  font-family: monospace, monospace;
  font-size: 1.1em;
  overflow: auto;
  height: calc(100vh - 150px);
  line-height: 22px;
  word-wrap: break-word;
}

.log-msg {
  white-space: pre-wrap;
  color: #27AA5E;
  line-height: initial;
  width: calc(100vw - 150px);
}

.full-modal {
  .ant-modal {
    max-width: 100%;
    top: 0;
    padding-bottom: 0;
    margin: 0;
  }

  .ant-modal-content {
    display: flex;
    flex-direction: column;
    height: calc(100vh);
  }

  .ant-modal-body {
    flex: 1;
  }

  .ant-modal-footer {
    text-align: center;
  }
}

.single-row {
  height: 36px;
}

.ant-divider-horizontal {
  margin: 5px 0;
}

.overflow-hidden {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.span-red {
  color: red;
}

.span-green {
  color: #4efc18;
}

.row-content {
  border: 1px solid transparent;
  padding: 4px 15px;
  white-space: nowrap;
  width: 100%;
}

.line-number {
  color: #cce85f;
}

</style>
