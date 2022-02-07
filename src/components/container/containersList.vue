<template>
  <div style="height: 100%;width: 100%">
    <!--    <a-divider style="height: 4px; background-color: #7cb305" />-->
    <a-collapse v-model:activeKey="activeContainerPanelKey" :destroyInactivePanel="true" :accordion="true">
      <a-collapse-panel key="tableHeader" :showArrow="false" disabled>
        <template #header>
          <container-info-header></container-info-header>
        </template>
      </a-collapse-panel>
      <a-collapse-panel v-for="(containerInfo, index) in containersInfo" :key="index" :showArrow="false"
                        :disabled="containerInfo.State !== 'running'">
        <template #header>
          <container-info :container-info="containerInfo"></container-info>
        </template>
        <container-resource-stats-detail :id="uuid()" :container-info="containerInfo"></container-resource-stats-detail>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script>
import axios from "axios";
import ContainerInfo from "@/components/container/containerInfo";
import ContainerInfoHeader from "@/components/container/containerInfoHeader";
import ContainerResourceStatsDetail from "@/components/container/containerResourceStatsDetail";
import util from "@/utils";

export default {
  name: "containersList",
  components: {ContainerResourceStatsDetail, ContainerInfoHeader, ContainerInfo},
  data() {
    return {
      containersInfo: [],
      timer: {},
      activeContainerPanelKey: '',
    };
  },
  mounted() {
    this.getContainerInfo();
    this.timer = setInterval(() => {
      this.getContainerInfo();
    }, 2000);
  },
  unmounted() {
    clearInterval(this.timer);
  },
  methods: {
    uuid() {
      util.getUUID();
    },
    getContainerInfo() {
      let _this = this;
      axios.get('/api/v1/containers')
        .then(function (response) {
          _this.containersInfo = response.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }
};
</script>

<style scoped>
.ant-divider-horizontal {
  margin: 5px 0;
}
</style>
