<template>
  <div>
    <a-row class="single-row">
      <a-col :span="5">
        <a-button :title="'容器名称: ' + name" type="link" style="width: 100%">
          <span class="overflow-hidden">
            {{ name }}
          </span>
        </a-button>
      </a-col>
      <a-col :span="6">
        <a-button :title="'容器镜像: ' + containerInfo.Image" style="width: 100%" type="link">
          <span class="overflow-hidden">
            {{ containerInfo.Image }}
          </span>
        </a-button>
      </a-col>
      <a-col :span="6">
        <a-space>
          <a-button type="text" style="width: 150px">
            <span :class="cpuClass"><span>CPU:  </span>{{ cpuUsageCore }} &nbsp;&nbsp; {{ cpuUsagePercent }}</span>
          </a-button>
          <!--          <a-button type="text"><span><span>cpu使用率:  </span></span></a-button>-->
          <a-button type="text" style="width: 150px">
            <span :class="memClass"><span>内存:  </span>{{ memUsageMb }} &nbsp;&nbsp; {{ memUsagePercent }}</span>
          </a-button>
          <!--          <a-button type="text"><span><span>内存使用率:  </span>{{ memUsagePercent }}</span></a-button>-->
        </a-space>
      </a-col>
    </a-row>
<!--    <a-divider style="height: 2px; background-color: #7cb305"/>-->
  </div>
</template>

<script>
import containerResourceStats from '@/components/containerResourceStats';
import axios from "axios";
import {v4} from "uuid";

export default {
  name: "containerInfo",
  components: {
    // containerResourceStats
  },
  props: {
    containerInfo: Object,
  },
  data() {
    return {
      stsData: {},
      memUsagePercent: '',
      memUsageMb: '',
      cpuUsagePercent: '',
      cpuUsageCore: '',
      cpuClass: '',
      memClass: ''
    };
  },
  mounted() {
    let _this = this;
    let url = '/v1/container/' + this.containerInfo.Id + '/stats';
    axios.get(url)
      .then(function (response) {
        console.log(response);
        _this.stsData = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  methods: {
    uuid() {
      return v4();
    }
  },
  watch: {
    stsData(newValue, oldValue) {
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

    }
  },

  computed: {
    name() {
      let name = this.containerInfo.Names[0];
      if (name.charAt(0) === '/') {
        name = name.slice(1);
      }
      return name;
    }
  }
};
</script>

<style scoped>
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
</style>
