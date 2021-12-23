<template>
  <div :id=id style="height: 100%;width:100%">

  </div>
</template>

<script>
import {Bullet} from '@antv/g2plot';
export default {
  name: 'containerResourceStats',
  props: {
    id: String,
    stsData: Object
  },
  data() {
    return {
      plotData: [
        {
          title: '内存',
          ranges: [30, 75, 100],
          measures: [0],
          target: 100,
        },
        {
          title: 'CPU',
          ranges: [30, 75, 100],
          measures: [0],
          target: 100,
        }
      ],
      bulletPlot: Bullet
    };
  },
  mounted() {
    this.bulletPlot = new Bullet(this.id, {
      data: this.plotData,
      measureField: 'measures',
      rangeField: 'ranges',
      targetField: 'target',
      xField: 'title',
      color: {
        range: ['#bfeec8', '#FFe0b0', '#FFbcb8'],
        measure: '#5B8FF9',
        target: '#FFbcb8',
      },
      label: {
        measure: {
          position: 'middle',
          style: {
            fill: '#364fc7',
          },
        },
      },
      tooltip: {
        formatter: (datum) => {
          console.log(datum);
          return { name: datum.title + '使用值', value: datum.measures + '%' };
        },
      },
      xAxis: {
        line: null,
      },
      yAxis: false,
      style: {
        lineWidth: 10
      }
    });
    this.bulletPlot.render();
  },
  watch: {
    stsData(newValue, oldValue) {
      let memoryStats = newValue['memory_stats'];
      let memUsed = memoryStats.usage;
      if (memoryStats['stats']['cache']) {
        memUsed = memUsed - memoryStats['stats']['cache'];
      }
      let availableMem = memoryStats['limit'];
      this.plotData[0].measures = [Math.round(memUsed / availableMem * 100)];

      let cpuStats = newValue['cpu_stats'];
      let cpuDelta = cpuStats['cpu_usage']['total_usage'] - newValue['precpu_stats']['cpu_usage']['total_usage'];
      let systemCpuDelta = cpuStats['system_cpu_usage'] - newValue['precpu_stats']['system_cpu_usage'];
      let numberCpus = cpuStats['online_cpus'];
      if (!numberCpus){
        numberCpus = cpuStats['cpu_usage']['percpu_usage'].length;
      }
      this.plotData[1].measures = [Math.round(cpuDelta / systemCpuDelta * 100 * numberCpus)];
      this.bulletPlot.changeData(this.plotData);

    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
