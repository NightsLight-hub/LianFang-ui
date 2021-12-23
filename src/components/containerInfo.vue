<template>
  <div>
    <a-row>
      <a-col :span="6">
        <a-button type="link">{{ name }}</a-button>
        <a-button type="link">{{ containerInfo.Image }}</a-button>
      </a-col>
      <a-col :span="12">
        <container-resource-stats :id="uuid()" :sts-data="stsData"></container-resource-stats>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import containerResourceStats from '@/components/containerResourceStats';
import axios from "axios";
import {v4} from "uuid";

export default {
  name: "containerInfo",
  components: {
    containerResourceStats
  },
  props: {
    containerInfo: Object,
    stsData: Object,
  },
  data() {
    return {};
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

</style>
