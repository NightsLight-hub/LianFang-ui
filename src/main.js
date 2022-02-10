import {createApp} from 'vue';
import App from './App.vue';
import store from './store';
import router from './router';
import Antd, {message, Modal} from 'ant-design-vue';
// import 'ant-design-vue/dist/antd.dark.css';
import '@surely-vue/table/dist/index.css';
import STable from '@surely-vue/table';

const app = createApp(App);
app.use(router).use(store).use(Antd).use(STable);
app.config.globalProperties.$message = message;
app.config.globalProperties.$info = Modal.info;
app.config.globalProperties.$success = Modal.success;
app.config.globalProperties.$error = Modal.error;
app.config.globalProperties.$warning = Modal.warning;
app.config.globalProperties.$confirm = Modal.confirm;
app.config.globalProperties.$destroyAll = Modal.destroyAll;
app.mount('#app');

