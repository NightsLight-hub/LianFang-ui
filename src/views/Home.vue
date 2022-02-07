<template>
  <div class="home">
    <div style="height: 200px;width: 100%">
      <containers-list></containers-list>
    </div>

  </div>
</template>

<script>
// @ is an alias to /src
import axios from 'axios';
import {v4} from 'uuid';
import ContainersList from "@/components/container/containersList";

export default {
  name: 'Home',
  components: {
    ContainersList,
  },
  data() {
    return {
      stsData: Object
    };
  },
  mounted() {
    let _this = this;

  },
  methods: {
    uuid(){
      return v4();
    }
  }
};
</script>
