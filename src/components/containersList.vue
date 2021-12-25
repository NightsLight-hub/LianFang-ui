<template>
  <div style="height: 100%;width: 100%">
    <a-divider style="height: 4px; background-color: #7cb305" />
    <container-info v-for="(containerInfo, index) in containersInfo" :key="index" :container-info="containerInfo"></container-info>
  </div>
</template>

<script>
import axios from "axios";
import ContainerInfo from "@/components/containerInfo";

export default {
  name: "containersList",
  components: {ContainerInfo},
  data() {
    return {
      containersInfo: []
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
  methods: {}
};
</script>

<style scoped>
.ant-divider-horizontal {
  margin: 5px 0;
}
</style>
