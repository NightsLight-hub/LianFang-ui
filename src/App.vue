<template>
  <div id="root-container">
    <a-layout style="height: 100%;width: 100%">
      <a-layout-sider style="height: 100%;width: 100%" v-model:collapsed="siderCollapsed" collapsible>
        <a-menu
          mode="inline"
          theme="dark"
          v-model:selectedKeys="selectedKeys"
          @click="menuClick"
        >
          <a-menu-item key="home">
            <template #icon>
              <PieChartOutlined/>
            </template>
            <span>容器监控</span>
          </a-menu-item>
          <!--          <a-menu-item key="2">-->
          <!--            <template #icon>-->
          <!--              <DesktopOutlined />-->
          <!--            </template>-->
          <!--            <span>Option 2</span>-->
          <!--          </a-menu-item>-->
          <!--          <a-menu-item key="3">-->
          <!--            <template #icon>-->
          <!--              <InboxOutlined />-->
          <!--            </template>-->
          <!--            <span>Option 3</span>-->
          <!--          </a-menu-item>-->
        </a-menu>
      </a-layout-sider>
      <a-layout-content>
<!--        <div class="content-header">-->
<!--          <a-switch checked-children="亮" un-checked-children="暗" @change="changeTheme" v-model:checked="lightTheme"/>-->
<!--        </div>-->
        <div id="content-container">
          <router-view/>
        </div>
      </a-layout-content>
    </a-layout>
  </div>
  <!--  <div id="nav">-->
  <!--    <router-link to="/">Home</router-link> |-->
  <!--    <router-link to="/about">About</router-link>-->
  <!--  </div>-->

</template>
<script>
import {PieChartOutlined} from '@ant-design/icons-vue';

export default {
  name: 'App',
  components: {
    PieChartOutlined
  },
  data() {
    return {
      siderCollapsed: true,
      selectedKeys: ['home'],
      lightTheme: false,
    };
  },
  methods: {
    menuClick({item, key, keyPath}) {
      switch (key) {
        case 'home':
          this.$router.replace('/');
          break;
        default:
          this.$router.replace('/');
      }
    },
  },
};

</script>
<style lang="less">
@import "@{global-theme}";

#root-container {
  height: 100%;
  width: 100%;
}

#content-container {
  height: 100%;
  width: 100%;
  padding: 10px;
}

.content-header {
  height: 42px;
  width: 100%;
}
</style>
