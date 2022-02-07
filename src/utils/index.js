/**
 * 工具
 */
import {v4} from 'uuid';

const util = {
    getUUID() {
      v4();
    },

    v1Api() {
      return '/api/v1';
    },

    getUrlParams() {
        let url = location.search; //获取url中"?"符后的字串
        let params = {};
        if (url.indexOf("?") != -1) {
            let strs = url.substr(1).split("&");
            for (var i = 0; i < strs.length; i++) {
                let pair = strs[i].split("=");
                if (pair.length === 2) {
                    params[pair[0]] = unescape(pair[1]);
                } else if (pair.length === 1) {
                    params[pair[0]] = "";
                } else {
                    let eqIndex = strs.indexOf("=");
                    if (eqIndex != -1) {
                        let name = strs.substr(0, eqIndex);
                        let value = strs.substr(eqIndex + 1);
                        params[name] = unescape(value);
                    }
                }
            }
        }
        return params;
    },

    /**
     * 文件字节数转换为人可读的文件体积
     * @param {Number} bytes 字节数
     */
    bytesCountToHumanReadable(bytes) {
        const unit = 1024;
        let i = 0;
        while (bytes >= unit) {
            bytes /= unit;
            i++;
        }

        return i == 0 ? bytes + " B" : Math.round(parseFloat(Number(bytes).toFixed(1)) * 10) / 10 + " " + " KMGTPEZY"[i] + "B";
    },

    /*  设置光标位置
       * @params {Object} ele 输入框元素
       * @params {Number} pos 需要将光标设置的位置
       * */
    setCursorPosition (ele, selectStart, selectEnd) {
        if (ele.setSelectionRange) {
            ele.focus();
            /* 选中输入框指定位置文本
            * selectionStart 起始位置
            * selectionEnd 终点位置
            * */
            ele.setSelectionRange(selectStart, selectEnd);
        } else if (ele.createTextRange) { // IE
            let range = ele.createTextRange();
            range.collapse(true);
            range.moveStart('character', selectStart);
            range.moveEnd('character', selectEnd);
            range.select();
        } else {
            if (window.getSelection) { //ie11 10 9 ff safari
                ele.focus(); //解决ff不获取焦点无法定位问题
                let range = window.getSelection(); //创建range
                range.selectAllChildren(ele); //range 选择obj下所有子内容
                // range.collapseToEnd(); //光标移至最后
            } else if (document.selection) { //ie10 9 8 7 6 5
                let range = document.selection.createRange(); //创建选择对象
                range.moveToElementText(ele); //range定位到obj
                // range.collapse(false); //光标移至最后
                range.select();
            }
        }
    },
    getStringShowWidth (str) {
        let id = '___getStringShowWidth_span___';
        let span = document.getElementById(id);
        if (!span) {
            span = document.createElement('span');
            span.id = id;
            span.style.visibility = 'hidden';
            document.body.append(span);
        }
        span.innerText = str;
        return span.offsetWidth;
    },
    getEllipsisString (str, width) {
        let sw = 0;
        let ellipsisStr = '';

        for (let i = str.length; i > 0; i--) {
            ellipsisStr = str.substring(0, i);
            sw = util.getStringShowWidth(ellipsisStr);
            // console.log(sw + 'px -> ' + ellipsisStr)
            if (sw <= width) {
                if (i === str.length) {
                    return ellipsisStr;
                }
                break;
            }
        }

        let ellipsis = '...';
        let ellipsisWidth = util.getStringShowWidth(ellipsis);
        if (sw + ellipsisWidth > width) {
            let newEllipsisStr = ellipsisStr;
            for (let i = ellipsisStr.length; i > 0; i--) {
                newEllipsisStr = ellipsisStr.substring(0, i);
                sw = util.getStringShowWidth(newEllipsisStr);
                // console.log(sw + 'px a-> ' + newEllipsisStr)
                if ((sw + ellipsisWidth) <= width) {
                    return newEllipsisStr + ellipsis;
                }
            }
        } else {
            return ellipsisStr + ellipsis;
        }
    }
};

export default util;
