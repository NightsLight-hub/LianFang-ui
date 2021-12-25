<template>
  <a-row style="height: 300px">
    <a-col :span="6">
      <div :id="id+'-cpu'" style="height: 100%;width:100%"></div>
    </a-col>
    <a-col :span="6">
      <div :id="id+'-mem'" style="height: 100%;width:100%"></div>
    </a-col>
    <a-col :span="6">
      <div :id="id+'-disk'" style="height: 100%;width:100%"></div>
    </a-col>
    <a-col :span="6">
      <div :id="id+'-net'" style="height: 100%;width:100%"></div>
    </a-col>
  </a-row>

</template>

<script>
import {Gauge} from '@antv/g2plot';

export default {
  name: "containerResourceStatsDetail",
  props: {
    id: String,
    containerInfo: Object,
  },
  data() {
    return {
      cpuGuage: {},
      memGuage: {},
      diskIoGuage: {},
      netIoGuage: {}
    };
  },
  mounted() {
    const globalOptions = {
      percent: 0.75,
      type: 'meter',
      innerRadius: 0.75,
      range: {
        ticks: [0, 1 / 3, 2 / 3, 1],
        color: ['#30BF78', '#FAAD14', '#F4664A'],
      },
      indicator: {
        pointer: {
          style: {
            stroke: '#D0D0D0',
          },
        },
        pin: {
          style: {
            stroke: '#D0D0D0',
          },
        },
      },
      statistic: {
        content: {
          style: {
            fontSize: '36px',
            lineHeight: '36px',
          },
        },
      },
    };
    this.cpuGuage = new Gauge(this.id + '-cpu', {
      ...globalOptions,
      percent: 0.75
    });
    this.memGuage = new Gauge(this.id + '-mem', {
      ...globalOptions,
      percent: 0.75
    });
    this.diskIoGuage = new Gauge(this.id + '-disk', {
      ...globalOptions,
      percent: 0.75
    });
    this.netIoGuage = new Gauge(this.id + '-net', {
      ...globalOptions,
      percent: 0.75
    });

    this.guageRender();
  },
  methods: {
    guageRender() {
      this.cpuGuage.render();
      this.memGuage.render();
      this.diskIoGuage.render();
      this.netIoGuage.render();
    }
  }
};
</script>

<style scoped>

</style>
