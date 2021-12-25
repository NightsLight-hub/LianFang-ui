<template>
  <div style="height: 100%;width: 100%">
<!--    <a-divider style="height: 4px; background-color: #7cb305" />-->
    <a-collapse v-model:activeKey="activeContainerPanelKey">
      <a-collapse-panel key="tableHeader" :showArrow="false" disabled>
        <template #header>
          <container-info-header></container-info-header>
        </template>
      </a-collapse-panel>
      <a-collapse-panel v-for="(containerInfo, index) in containersInfo" :key="index">
        <template #header>
          <container-info  :container-info="containerInfo"></container-info>
        </template>
        <container-resource-stats-detail :id="uuid()" :container-info="containerInfo"></container-resource-stats-detail>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script>
import axios from "axios";
import ContainerInfo from "@/components/containerInfo";
import ContainerInfoHeader from "@/components/containerInfoHeader";
import ContainerResourceStatsDetail from "@/components/containerResourceStatsDetail";
import {v4} from "uuid";

export default {
  name: "containersList",
  components: {ContainerResourceStatsDetail, ContainerInfoHeader, ContainerInfo},
  data() {
    return {
      containersInfo: [],
      activeContainerPanelKey: '',
    };
  },
  mounted() {
    let _this = this;
    axios.get('/v1/containers')
      .then(function (response) {
        _this.containersInfo = response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
  },
  methods: {
    uuid(){
      return v4();
    }
  }
};
</script>

<style scoped>
.ant-divider-horizontal {
  margin: 5px 0;
}
</style>
