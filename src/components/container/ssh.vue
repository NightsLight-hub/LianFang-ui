<template>
  <div style="height: calc(100vh - 150px);width: 100%">
    <div id="terminal"></div>
  </div>
</template>

<script>
import {Terminal} from "xterm";
// import { AttachAddon } from 'xterm-addon-attach';
import {FitAddon} from 'xterm-addon-fit';

export default {
  name: "ssh",
  data() {
    return {
      terminal: {},
      socket: {},
      socketURI: '',
      execPrepared: false,
    };
  },
  props: {
    containerInfo: Object,
  },
  mounted() {
    this.socketURI = `ws://${location.host}/ws/container/ssh/${this.containerInfo.Id}`;
    this.initSocket();
  },
  beforeUnmount() {
    this.socket.close();
  },
  methods: {
    initTerm() {
      this.terminal = new Terminal({
        rendererType: "canvas", //渲染类型
        // rows: parseInt(_this.rows), //行数
        // cols: parseInt(_this.cols), // 不指定行数，自动回车后光标从下一行开始
        convertEol: true, //启用时，光标将设置为下一行的开头
        //   scrollback: 50, //终端中的回滚量
        disableStdin: false, //是否应禁用输入。
        // cursorStyle: "underline", //光标样式
        cursorBlink: true, //光标闪烁
        theme: {
          foreground: "#7e9192", //字体
          background: "#002833", //背景色
          cursor: "help", //设置光标
          lineHeight: 16
        }
      });
      const fitAddon = new FitAddon();
      this.terminal.loadAddon(fitAddon);
      // const attachAddon = new AttachAddon(webSocket);
      // term.loadAddon(attachAddon);

      this.terminal.open(document.getElementById('terminal'));
      fitAddon.fit();
      this.onTerminalResize();
      window.addEventListener("resize", this.onTerminalResize);
      this.terminal.focus();
      this.terminal.write('感谢使用联坊，我们默认使用\x1B[1;3;31m/bin/sh\x1B[0m来开启伪终端 \r\n');
      let _this = this;
      this.terminal.onData(function (data) {
        _this.socket.send(data);
        // sock.send(JSON.stringify({'data': data}));
      });
    },
    onTerminalResize() {
      const terminalContainer = document.getElementById("terminal");
      const width = terminalContainer.parentElement.clientWidth;
      const height = terminalContainer.parentElement.clientHeight;
      const {terminal} = this;
      // 计算cols，rows
      const cols =
        (width - terminal._core.viewport.scrollBarWidth - 15) /
        terminal._core._renderService._renderer.dimensions.actualCellWidth;
      const rows =
        height /
        terminal._core._renderService._renderer.dimensions.actualCellHeight -
        1;
      this.terminal.resize(
        parseInt(cols.toString(), 10),
        parseInt(rows.toString(), 10)
      );
    },
    initSocket() {
      if (this.socketURI == "") {
        return;
      }
      try {
        this.socket = new WebSocket(this.socketURI);
        this.socketOnClose();
        this.socketOnOpen();
        this.socketOnmessage();
        this.socketOnError();
      } catch (e) {
        this.$message.error(e.toString(), 5);
      }

    },
    socketOnOpen() {
      let _this = this;
      _this.socket.onopen = () => {
        console.log("web链接成功");
        // 链接成功后
        _this.initTerm();
        _this.onTerminalResize();
      };
    },
    socketOnmessage() {
      let _this = this;
      _this.socket.onmessage = (evt) => {
        try {
          //当收到这个关键词，说明后端已经准备好exec了，可以交互操作容器shell
          if (evt.data === 'LianFangSshChannelPrepareFinished') {
            _this.execPrepared = true;
            return;
          }
          if (this.execPrepared){
            evt.data.arrayBuffer().then(buffer => {
              _this.terminal.write(new Uint8Array(buffer));
            });
          }else {
            // 如果后端没准备好exec，此时收到的后端信息，直接展示出来
            _this.terminal.writeln(evt.data);
          }
        } catch (e) {
          console.error(e);
          console.log("parse json error.", evt.data);
        }
      };
    },
    socketOnClose() {
      let _this = this;
      _this.socket.onclose = () => {
        _this.socket.close();
        console.log("关闭 socket");
        // if (this.socket) {
        //   this.socket.close();
        // }
        window.removeEventListener("resize", this.onTerminalResize);
      };
    },
    socketOnError() {
      let _this = this;
      _this.socket.onerror = (event) => {
        console.log("socket 链接失败", event);
      };
    },
  }
};
</script>

<style lang="less" scoped>

@import '../../../node_modules/xterm/css/xterm.css';

#terminal {
  height: 100%;
}
</style>
