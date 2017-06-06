//----------loadjs----------//
// document.write(
//     "<style type=\"text/css\">" +
//     "   * {margin:0;padding:0}" +
//     "   body,html,canvas {width:100%;height: 100%;overflow-y: hidden;}" +
//     "</style>");
// document.write(
//     "<style type=\"text/css\">" +
//     "   * {margin:0;padding:0}" +
//     "   body,html,canvas {width:100%;height: 100%;}" +
//     "</style>");
document.write(
    "<style type='text/css'>" +
    "   * {margin:0;padding:0}" +
    "   body,html,canvas {width:100%;height: 100%;overflow-y: hidden;}" +
    "</style>");
document.write(
    "<audio id='background_audio' autoplay='true' loop='loop' >" +
    "</audio>");
//----------variable----------//

var zfile;
var zloading;


var zlayer;

var zanimation;
var zevent;

var zlayer_keys;

var gl;
var webgl_flag;
var webgl_width;
var webgl_height;
var webgl_x;
var webgl_y;
var window_width;
var window_height;
var uniform_scale;
var uniform_angle;
var uniform_origin;
var uniform_translate;
var matrix_screen;
var texture_object;
var uniform_texcoord_scale;
var uniform_texcoord_translate;
var uniform_texture_color;
var uniform_opposite;
var touch_mode = false;

var play_speed = 1;
var fps_date;
var fps_second = 0;
var fps = 0;

var XMap = {
    /**
     * 地图类
     * @class XMap.op
     * @constructor
     */
    op: function (json_map, texture_key, divide_x, divide_y) {
        var xMap = {};
        xMap.json_map = json_map;
        xMap.texture_key = texture_key;
        xMap.divide_x = divide_x;
        xMap.divide_y = divide_y;
        xMap.width = webgl_width / 16;
        xMap.height = webgl_height / 9;
        /**
         * 逻辑更新
         * @method 逻辑更新
         * @for XMap.op
         */
        xMap.plan = function () {
            webgl_x += 0.05;
            webgl_y += 0.05;
        }
        /**
         * 地图绘制
         * @method 地图绘制
         * @for XMap.op
         */
        xMap.play = function () {
            gl.uniform4f(uniform_scale, xMap.width, xMap.height, 1, 1);
            gl.uniform4f(uniform_origin, xMap.width / 2, xMap.height / 2, 0, 0);
            gl.uniformMatrix4fv(uniform_angle, false, new Float32Array([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]));
            gl.uniform2f(uniform_texcoord_scale, 1 / xMap.divide_x, 1 / xMap.divide_y);
            gl.uniform1f(uniform_opposite, 1);
            gl.uniform4f(uniform_texture_color, 1, 1, 1, 1);
            gl.bindTexture(gl.TEXTURE_2D, zfile.images[xMap.texture_key].texture);
            for (var i = Math.floor(webgl_y); i < Math.ceil(webgl_y) + 9; i ++) for (var j = Math.floor(webgl_x); j <  Math.ceil(webgl_y) + 16; j ++) {
                gl.uniform4f(uniform_translate, (j - webgl_x) * xMap.width, (i - webgl_y) * xMap.height, 0, 0);
                gl.uniform2f(uniform_texcoord_translate, (xMap.json_map.floor[i][j][0] - 1) / xMap.divide_x,
                    (xMap.json_map.floor[i][j][1] - 1) / xMap.divide_y);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            }
        }
        return xMap;
    }
}
var XActor = {
    /**
     * 骨骼片段类
     * @class XActor.op_bone
     * @constructor
     */
    op_bone: function (x, y, origin_x, origin_y, angle,texture_key, divide_x, divide_y, choose_x, choose_y, click) {
        var xActor = {};
        xActor.group_x = 0;
        xActor.group_y = 0;
        xActor.x = x;
        xActor.y = y;
        xActor.texture_key = texture_key;

        xActor.origin_x = origin_x;
        xActor.origin_y = origin_y;
        xActor.angle = angle;
        xActor.divide_x = divide_x;
        xActor.divide_y = divide_y;
        xActor.choose_x = choose_x;
        xActor.choose_y = choose_y;
        xActor.blind_parent_x = x;
        xActor.blind_parent_y = y;
        xActor.scale = 1;
        xActor.alpha = 1;
	xActor.click = click;
        xActor.child = new Array();
        /**
         * 添加子骨骼，先进先出原则
         * @method 添加子骨骼
         * @for XActor.op_bone
         * @param {XActor.op_bone} child 子骨骼
         */
        xActor.add_child = function (child) {
            xActor.child.push(child);
        }
        /**
         * 缩放大小（包括子骨骼）
         * @method 缩放
         * @for XActor.op_bone
         * @param {float} scale 缩放比例
         */
        xActor.scale_to = function (scale) {
            xActor.origin_x = xActor.origin_x * scale / xActor.scale;
            xActor.origin_y = xActor.origin_y * scale / xActor.scale;
            xActor.blind_parent_x = xActor.blind_parent_x * scale / xActor.scale;
            xActor.blind_parent_y = xActor.blind_parent_y * scale / xActor.scale;

            xActor.scale = scale;
            for (var i = 0; i < xActor.child.length; i++) {
                xActor.child[i].scale_to(scale);
            }
        }
        /**
         * 逻辑更新
         * @method 逻辑更新
         * @for XActor.op_bone
         */
        xActor.plan = function () {

            for (var i = 0; i < xActor.child.length; i++) {
                xActor.child[i].x = xActor.child[i].blind_parent_x * Math.cos(xActor.angle)
                    + xActor.child[i].blind_parent_y * Math.sin(xActor.angle) + xActor.x;
                xActor.child[i].y = -xActor.child[i].blind_parent_x * Math.sin(xActor.angle)
                    + xActor.child[i].blind_parent_y * Math.cos(xActor.angle) + xActor.y + (xActor.scale*zfile.images[xActor.texture_key].height / xActor.divide_y) / 2 ;
                xActor.child[i].plan();
            }
        }
        /**
         * 骨骼绘制
         * @method 骨骼绘制
         * @for XActor.op_bone
         */
        xActor.play = function () {
            if (xActor.x - (xActor.scale*zfile.images[xActor.texture_key].width / xActor.divide_x) / 2 < webgl_width + webgl_x && xActor.x + (xActor.scale*zfile.images[xActor.texture_key].width / xActor.divide_x) / 2 > webgl_x &&
                xActor.y - (xActor.scale*zfile.images[xActor.texture_key].height / xActor.divide_y)  < webgl_height + webgl_y && xActor.y  > webgl_y) {
                gl.uniform4f(uniform_scale, (xActor.scale*zfile.images[xActor.texture_key].width / xActor.divide_x), (xActor.scale*zfile.images[xActor.texture_key].height / xActor.divide_y), 1, 1);
                gl.uniform4f(uniform_origin, xActor.origin_x, xActor.orijin_y, 0, 0);
                gl.uniformMatrix4fv(uniform_angle, false, new Float32Array([
                    Math.cos(xActor.angle), Math.sin(xActor.angle), 0, 0,
                    -Math.sin(xActor.angle), Math.cos(xActor.angle), 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                ]));
                gl.uniform4f(uniform_translate, xActor.x + xActor.group_x + webgl_x, xActor.y + (xActor.scale*zfile.images[xActor.texture_key].height / xActor.divide_y) / 2 + xActor.group_y + webgl_y, 0, 0);
                gl.uniform2f(uniform_texcoord_scale, 1 / xActor.divide_x, 1 / xActor.divide_y);
                gl.uniform2f(uniform_texcoord_translate, (xActor.choose_x - 1) / xActor.divide_x, (xActor.choose_y - 1) / xActor.divide_y);

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                for (var i = 0; i < xActor.child.length; i++) {
                    xActor.child[i].play();
                }
            }
        }
        /**
         * 判断点是否在角色内
         * @method 判断点是否在角色内
         * @for XActor.op_bone
         */
        xActor.in_actor = function (x, y) {
            if(x + webgl_x >= xActor.x - (xActor.scale*zfile.images[xActor.texture_key].width / xActor.divide_x) / 2 && x + webgl_x <= xActor.x + (xActor.scale*zfile.images[xActor.texture_key].width / xActor.divide_x) / 2 &&
                y + webgl_y >= xActor.y && y + webgl_y <= xActor.y+(xActor.scale*zfile.images[xActor.texture_key].height / xActor.divide_y)) {
                return true;
            }
            return false;
        }
        /**
         * 响应按下事件
         * @method 响应按下事件
         * @for XActor.op_bone
         */
        xActor.down = function (x, y) {

        }
        /**
         * 响应移动事件
         * @method 响应移动事件
         * @for XActor.op_bone
         */
        xActor.move = function (x, y) {

        }
        /**
         * 响应抬起事件
         * @method 响应抬起事件
         * @for XActor.op_bone
         */
        xActor.up = function (x, y) {

        }
        return xActor;
    },
    /**
     * 角色类
     * @class XActor.op
     * @constructor
     */
    op: function (x, y, origin_x, origin_y, angle, texture_key, divide_x, divide_y, choose_x, choose_y, click) {
        var xActor = XActor.op_bone(x, y, origin_x, origin_y, angle, texture_key, divide_x, divide_y, choose_x, choose_y, click);
        
        /**
         * 角色绘制
         * @method 角色绘制
         * @for XActor.op
         */
        xActor.play = function () {
            if (xActor.x - (xActor.scale*zfile.images[xActor.texture_key].width / xActor.divide_x) / 2 < webgl_width + webgl_x && xActor.x + (xActor.scale*zfile.images[xActor.texture_key].width / xActor.divide_x) / 2 > webgl_x &&
                xActor.y - (xActor.scale*zfile.images[xActor.texture_key].height / xActor.divide_y) < webgl_height + webgl_y && xActor.y  > webgl_y) {
                gl.uniform4f(uniform_scale, (xActor.scale*zfile.images[xActor.texture_key].width / xActor.divide_x), (xActor.scale*zfile.images[xActor.texture_key].height / xActor.divide_y), 1, 1);
                gl.uniform4f(uniform_origin, xActor.origin_x, xActor.origin_y, 0, 0);
                gl.uniformMatrix4fv(uniform_angle, false, new Float32Array([
                    Math.cos(xActor.angle), Math.sin(xActor.angle), 0, 0,
                    -Math.sin(xActor.angle), Math.cos(xActor.angle), 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                ]));
                gl.uniform4f(uniform_translate, xActor.x + xActor.group_x + webgl_x, xActor.y + (xActor.scale*zfile.images[xActor.texture_key].height / xActor.divide_y) / 2  + xActor.group_y + webgl_y, 0, 0);
                gl.uniform2f(uniform_texcoord_scale, 1 / xActor.divide_x, 1 / xActor.divide_y);
                gl.uniform2f(uniform_texcoord_translate, (xActor.choose_x - 1) / xActor.divide_x, (xActor.choose_y - 1) / xActor.divide_y);

                gl.uniform1f(uniform_opposite, 1);
                gl.uniform4f(uniform_texture_color, 1, 1, 1, 1);
                gl.bindTexture(gl.TEXTURE_2D, zfile.images[xActor.texture_key].texture);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                for (var i = 0; i < xActor.child.length; i++) {
                    xActor.child[i].play();
                }
            }
        }
        return xActor;
    }
};
var XFile = {
    /**
     * 文件加载类
     * @class XFile.op
     * @constructor
     */
    op: function () {
        var xFile = {};
        xFile.images = new Object();
        /**
         * 读取图像，绑定纹理ID
         * @method 加载图像
         * @for XFile.op
         * @param {string} key 纹理索引名字
         * @param {string} filepath 文件地址
         */
        xFile.image = function (key, filepath, loading_flag) {
            loading_flag ++;
            if (!(key in xFile.images)) {
                xFile.images[key] = {};
                xFile.images[key].width = 0;
                xFile.images[key].height = 0;
            }
            xFile.images[key].texture = gl.createTexture();
            var img = new Image();
            img.onload = function () {
                xFile.images[key].width = img.width;
                xFile.images[key].height = img.height;
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, xFile.images[key].texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.uniform1i(texture_object, 0);
                loading_flag --;
            }
	    img.crossOrigin = "Anonymous";
            img.src = filepath;
        }
        /**
         * CSS加载TTF字体文件
         * @method 加载TTF
         * @for XFile.op
         * @param {string} key 字体索引名字
         * @param {string} filepath 文件地址
         */
        xFile.font = function (key, filepath) {
            document.write(
                "<style id='"+key+"'>" +
                "   @font-face { " +
                "       font-family:" + key + ";" +
                "       src:url(" + filepath + ")}" +
                "</style>");
            document.fonts.load("1px "+key);
        }
        /**
         * 生成字体图像，绑定纹理ID
         * @method 加载字体图像
         * @for XFile.op
         * @param {string} key 纹理索引名字
         * @param {string} font 字体
         * @param {int} font_size 字体大小
         * @param {string} font_color 字体颜色
         * @param {int} width 宽度限制
         * @param {int} height 高度限制
         * @param {string} text 绘制文字
         */
        xFile.text = function (key, font, font_color, width, height, text, loading_flag) {
            loading_flag ++;
            if (!(key in xFile.images)) {
                xFile.images[key] = {};
                xFile.images[key].texture = gl.createTexture();
            }
            xFile.images[key].width = width;
            xFile.images[key].height = height;
            var image_op = document.createElement("canvas");
            var lines = new Array();
            var line = "";
            var font_size = font.split("px")[0].split(" ");
            font_size = font_size[font_size.length - 1];
            var ctx = image_op.getContext("2d");
            image_op.width = width;
            image_op.height = height;
            ctx.font = font;
            ctx.fillStyle = font_color;
            for (var i = 0; i < text.length; i++){
                if (ctx.measureText(line + text.substring(i, i+1)).width > width) {
                    lines.push(line);
                    line = "";
                }
                line += text.substring(i, i+1);
            }
            if (line != ""){
                lines.push(line);
            }
            // lines.reverse();
            for (var i = lines.length-1; i >=0; i--) {
                ctx.fillText(lines.pop(), 0, font_size * (i + 1));
            }
            line = null;
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, xFile.images[key].texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image_op);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.uniform1i(texture_object, 0);
            image_op = null;
            loading_flag --;
        }
        /**
         * 清空纹理
         * @method 清空纹理
         * @for XFile.op
         */
        xFile.clear = function () {
            for (var key in xFile.images) {
                if (key != 'loading' && key != 'loading_bar' && key != 'loading_text') {
                    gl.deleteTexture(xFile.images[key].texture);
                    delete xFile.images[key].width;
                    delete xFile.images[key].height;
                    delete xFile.images[key];
                }
            }
        }
        return xFile;
    }
}
var XFAnimation = {
    /**
     * 帧动画类
     * @class XFAnimation.op
     * @constructor
     */
    op: function (zmod, animation, actor, fps, end) {

        var xFAnimation = {};
        xFAnimation.animation = animation;
        xFAnimation.actor = actor;
        zmod[xFAnimation.actor].choose_x = 1;
        zmod[xFAnimation.actor].choose_y = 1;

        xFAnimation.replay = {};
        xFAnimation.replay.fps = fps;
        xFAnimation.fps = Math.abs(xFAnimation.replay.fps);

        /**
         * 逻辑更新
         * @method 逻辑更新
         * @for xFAnimation.op
         */
        xFAnimation.plan = function () {
            if (xFAnimation.fps == 0) {
                if (zmod[xFAnimation.actor].choose_x < zmod[xFAnimation.actor].divide_x) {
                    zmod[xFAnimation.actor].choose_x++;
                } else {
                    zmod[xFAnimation.actor].choose_x = 1;
                    if (zmod[xFAnimation.actor].choose_y < zmod[xFAnimation.actor].divide_y) {
                        zmod[xFAnimation.actor].choose_y++;
                    } else {
                        if (xFAnimation.replay.fps < 0) {
                            zmod[xFAnimation.actor].choose_x = 1;
                            zmod[xFAnimation.actor].choose_y = 1;
                            xFAnimation.fps = Math.abs(xFAnimation.replay.fps);
                        } else {
                            delete zanimation[xFAnimation.animation];
                            if (end != null) {
                                end();
                            }
                        }
                    }
                }
                xFAnimation.fps = Math.abs(xFAnimation.replay.fps);
            } else {
                xFAnimation.fps--;
            }
        }
        return xFAnimation;
    }
}
var XAnimation = {
    /**
     * 形状动画类
     * @class XAnimation.op
     * @constructor
     */
    op: function (zmod, animation, actor, x, y, scale, angle, alpha, fps, end) {
        var xAnimation = {};
        xAnimation.animation = animation;
        xAnimation.actor = actor;

        if (x == null) {
            xAnimation.x = zmod[xAnimation.actor].x;
        } else {
            xAnimation.x = x;
        }
        if (y == null) {
            xAnimation.y = zmod[xAnimation.actor].y;
        } else {
            xAnimation.y = y;
        }
        if (scale == null) {
            xAnimation.scale = zmod[xAnimation.actor].scale;
        } else {
            xAnimation.scale = scale;
        }
        if (angle == null) {
            xAnimation.angle = zmod[xAnimation.actor].angle;
        } else {
            xAnimation.angle = angle;
        }
        if (alpha == null) {
            xAnimation.alpha = zmod[xAnimation.actor].alpha;
        } else {
            xAnimation.alpha = alpha;
        }
        xAnimation.fps = fps;

        xAnimation.replay = {};
        if (fps < 0) {
            xAnimation.fps = -xAnimation.fps;
            xAnimation.replay.x = zmod[xAnimation.actor].x;
            xAnimation.replay.y = zmod[xAnimation.actor].y;
            xAnimation.replay.scale = zmod[xAnimation.actor].scale;
            xAnimation.replay.angle = zmod[xAnimation.actor].angle;
            xAnimation.replay.alpha = zmod[xAnimation.actor].alpha;
            xAnimation.replay.fps = xAnimation.fps;
        }
        /**
         * 逻辑更新
         * @method 逻辑更新
         * @for XAnimation.op
         */
        xAnimation.plan = function () {
            if (xAnimation.fps == 0) {
                zmod[xAnimation.actor].x = xAnimation.x;
                zmod[xAnimation.actor].y = xAnimation.y;
                if(xAnimation.scale != zmod[xAnimation.actor].scale) {
                    zmod[xAnimation.actor].scale_to(xAnimation.scale);
                }
                zmod[xAnimation.actor].angle = xAnimation.angle;
                zmod[xAnimation.actor].alpha = xAnimation.alpha;
                if (xAnimation.replay.fps != undefined) {
                    xAnimation.x = xAnimation.replay.x;
                    xAnimation.y = xAnimation.replay.y;
                    xAnimation.scale = xAnimation.replay.scale;
                    xAnimation.angle = xAnimation.replay.angle;
                    xAnimation.alpha = xAnimation.replay.alpha;
                    xAnimation.replay.x = zmod[xAnimation.actor].x;
                    xAnimation.replay.y = zmod[xAnimation.actor].y;
                    xAnimation.replay.scale = zmod[xAnimation.actor].scale;
                    xAnimation.replay.angle = zmod[xAnimation.actor].angle;
                    xAnimation.replay.alpha = zmod[xAnimation.actor].alpha;
                    xAnimation.fps = xAnimation.replay.fps;
                } else {
                    delete zanimation[xAnimation.animation];
                    if (end != null) {
                        end();
                    }
                }
            } else {
                zmod[xAnimation.actor].x += (xAnimation.x - zmod[xAnimation.actor].x) / xAnimation.fps;
                zmod[xAnimation.actor].y += (xAnimation.y - zmod[xAnimation.actor].y) / xAnimation.fps;
                if(xAnimation.scale != zmod[xAnimation.actor].scale) {
                    zmod[xAnimation.actor].scale_to(zmod[xAnimation.actor].scale + (xAnimation.scale - zmod[xAnimation.actor].scale) / xAnimation.fps);
                }
                zmod[xAnimation.actor].angle += (xAnimation.angle - zmod[xAnimation.actor].angle) / xAnimation.fps;
                zmod[xAnimation.actor].alpha += (xAnimation.alpha - zmod[xAnimation.actor].alpha) / xAnimation.fps;
                xAnimation.fps --;
            }
        }
        return xAnimation;
    }
}
/**
 * 主程序
 * @class SuuRPG.2d.js
 * @constructor
 */
/**
 * 程序初始化
 * @method 初始化
 * @for SuuRPG.2d.js
 * @param {string} canvas Canvas ID
 * @param {int} width 显示宽度像素

 * @param {int} fps 刷新频率
 */
function op(width, height){
    document.write("<canvas id='zxx'></canvas>");
    var canvas = document.getElementById('zxx');
    add_event(canvas);
    canvas.width = width;
    canvas.height = height;
    webgl_width = width;
    webgl_height = height;
    webgl_x = 0;
    webgl_y = 0;
    window_width = document.body.clientWidth;
    window_height = document.body.clientHeight;
    window.addEventListener("resize", function () {
        window_width = document.body.clientWidth;
        window_height = document.body.clientHeight;
    }, false);
    gl = canvas.getContext("webgl");
    webgl_op();
    zfile = XFile.op();
    zlayer = new Array();
    zlayer_keys = new Array();
    zevent = new Object();
    zloading = new Array();
    zanimation = new Object();
    window.requestAnimationFrame(webgl_plan);
    window.requestAnimationFrame(webgl_play);
}
/**
 * webgl初始化
 * @method webgl初始化
 * @for SuuRPG.2d.js
 */
function webgl_op(){
    gl.viewport(0, 0, webgl_width, webgl_height);

    //加载着色器
    var VERTEX_SHADER_SOURCE =
        "attribute vec3 attribute_position;\n" +
        "attribute vec2 attribute_texcoord;\n" +
        "varying vec2 varying_texcoord;\n" +
        "uniform vec4 uniform_scale;\n" +
        "uniform vec4 uniform_origin;\n" +
        "uniform mat4 uniform_angle;\n" +
        "uniform vec4 uniform_translate;\n" +
        "uniform mat4 matrix_screen;\n" +
        "uniform vec2 uniform_texcoord_scale;\n" +
        "uniform vec2 uniform_texcoord_translate;\n" +
        "void main() {\n" +
        "	varying_texcoord = attribute_texcoord * uniform_texcoord_scale + uniform_texcoord_translate;\n"+
        "	gl_Position = ((vec4(attribute_position, 1.0) * uniform_scale + uniform_origin) * uniform_angle + uniform_translate) * matrix_screen + vec4(-1, -1, 0, 0) ;\n" +
        "}\n";
    var FRAGMENT_SHADER_SOURCE =
        "#ifdef GL_ES\n" +
        "	precision mediump float;\n" +
        "#endif\n" +
        "varying vec2 varying_texcoord;\n" +
        "uniform sampler2D texture_object;\n" +
        "uniform vec4 uniform_texture_color;\n" +
        "uniform float uniform_opposite;\n" +
        "void main() {\n" +
        "	gl_FragColor = texture2D(texture_object, varying_texcoord) * uniform_texture_color;\n" +
        "}\n";

    var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vertex_shader, VERTEX_SHADER_SOURCE);
    gl.shaderSource(fragment_shader, FRAGMENT_SHADER_SOURCE);
    gl.compileShader(vertex_shader);
    gl.compileShader(fragment_shader);
    var program = gl.createProgram();
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);
    gl.useProgram(program);

    var attribute_position = gl.getAttribLocation(program, "attribute_position");
    gl.enableVertexAttribArray(attribute_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -.5, .5, 0,
        -.5, -.5, 0,
        .5, .5, 0,
        .5, -.5, 0,
    ]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribute_position, 3, gl.FLOAT, false, 0, 0);

    var attribute_texcoord = gl.getAttribLocation(program, "attribute_texcoord");
    gl.enableVertexAttribArray(attribute_texcoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        1, 1
    ]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(attribute_texcoord, 2, gl.FLOAT, false, 0, 0);
    matrix_screen = gl.getUniformLocation(program, "matrix_screen");
    uniform_scale = gl.getUniformLocation(program, "uniform_scale");
    uniform_angle = gl.getUniformLocation(program, "uniform_angle");
    uniform_origin = gl.getUniformLocation(program, "uniform_origin");
    uniform_translate = gl.getUniformLocation(program, "uniform_translate");
    uniform_texcoord_scale = gl.getUniformLocation(program, "uniform_texcoord_scale");
    uniform_texcoord_translate = gl.getUniformLocation(program, "uniform_texcoord_translate");
    texture_object = gl.getUniformLocation(program, "texture_object");
    uniform_texture_color = gl.getUniformLocation(program, "uniform_texture_color");
    uniform_opposite = gl.getUniformLocation(program, "uniform_opposite");
    gl.uniformMatrix4fv(matrix_screen, false, new Float32Array([
        2/webgl_width, 0, 0, 0,
        0, 2/webgl_height, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]));
    //透明png
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
}
/**
 * 逻辑更新之前
 * @method 逻辑更新之前
 * @for SuuRPG.2d.js
 */
function before_plan() {

}
/**
 * 逻辑运算
 * @method 逻辑运算
 * @for SuuRPG.2d.js
 */
function webgl_plan(){
    switch(webgl_flag){
        case 'loading':
            webgl_flag = 'loading';
            before_plan() ;
            for (var i = 0; i < zloading.length; i++) {
                zloading[i].plan();
            }
            fps_date = new Date();
            if (fps_date.getSeconds() - fps_second != 0) {
                fps_second = fps_date.getSeconds();
                console.log('fps:'+fps);
                fps = 0;
            }
            webgl_flag = 'loading_play';
            break;
        case 'screen':
            webgl_flag = 'screen';
            before_plan() ;
            for (var key in zanimation) {
                zanimation[key].plan();
            }
	    for (var i = 0; i < zlayer_keys.length; i++) {
		zlayer_keys[i] = zlayer_keys[i].sort(function(a,b){
			if (zlayer[i][b].y-zlayer[i][a].y > 0) {
			    return 1;
			} else if (zlayer[i][b].y-zlayer[i][a].y == 0){
			    if (zlayer[i][b].x-zlayer[i][a].x > 0) {
				return -1;
			    } else if (zlayer[i][b].x-zlayer[i][a].x == 0){
				return 0;
			    } else {
				return 1;
			    }
			} else {
			    return -1;
			}
		});
	    }
	    for (var i = 0; i < zlayer_keys.length; i++) {
		for (var j = 0; j < zlayer_keys[i].length; j++) {
			zlayer[i][zlayer_keys[i][j]].plan();
		}
	    }
            fps_date = new Date();
            if (fps_date.getSeconds() - fps_second != 0) {
                fps_second = fps_date.getSeconds();
                console.log('fps:'+fps);
                fps = 0;
            }
            webgl_flag = 'screen_play';
            break;
    }

    window.requestAnimationFrame(prepare_webgl_plan);
}
/**
 * 屏幕刷新之前
 * @method 屏幕刷新之前
 * @for SuuRPG.2d.js
 */
function before_play() {

}
/**
 * 保持逻辑更新30fps
 * @method 屏幕刷新之前
 * @for SuuRPG.2d.js
 */
function prepare_webgl_plan() {
	window.requestAnimationFrame(webgl_plan);
}
/**
 * 保持帧率30fps
 * @method 屏幕刷新之前
 * @for SuuRPG.2d.js
 */
function prepare_webgl_play() {
	window.requestAnimationFrame(webgl_play);
}
/**
 * 屏幕刷新
 * @method 屏幕刷新
 * @for SuuRPG.2d.js
 */
function webgl_play() {
    switch(webgl_flag){
        case 'loading_play':
            before_play();
            gl.clearColor(0.5, 0.5, 0.5, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            for (var i = 0; i < zloading.length; i++) {
                zloading[i].play();
            }
            fps++;
            webgl_flag = 'screen';
            webgl_flag = 'loading';
            break;
        case 'screen_play':
            before_play();
            gl.clearColor(0.5, 0.5, 0.5, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            for (var i = 0; i < zlayer_keys.length; i++) {
		for (var j = 0; j < zlayer_keys[i].length; j++) {
			zlayer[i][zlayer_keys[i][j]].play();
		}
	    }
            fps++;
            webgl_flag = 'screen';
            break;
    }
    window.requestAnimationFrame(prepare_webgl_play);
}
/**
 * 触摸点击事件响应
 * @method 触摸点击事件响应
 * @for SuuRPG.2d.js
 * @param {canvas} canvas 注册画布的点击事件
 */
function add_event(canvas){
    var x,y;
    if(touch_mode) {
        canvas.addEventListener("touchstart",function (e) {
            x = Math.round(e.touches[0].clientX / window_width * webgl_width);
            y = Math.round((1 - Math.floor(e.touches[0].clientY) / window_height) * webgl_height);
            down(x, y);
        },false);
        canvas.addEventListener("touchmove",function (e) {
            x = Math.round(e.touches[0].clientX / window_width * webgl_width);
            y = Math.round((1 - Math.floor(e.touches[0].clientY) / window_height) * webgl_height);
            move(x, y);
        },false);
        canvas.addEventListener("touchend",function (e) {
            x = Math.round(e.changedTouches[0].clientX / window_width * webgl_width);
            y = Math.round((1 - Math.floor(e.changedTouches[0].clientY) / window_height) * webgl_height);
            up(x, y);
        },false);
    } else {
        canvas.addEventListener("mousedown",function (e) {
            x = Math.round(e.clientX / window_width * webgl_width);
            y = Math.round((1 - e.clientY / window_height) * webgl_height);
            down(x, y);
        },false);
        canvas.addEventListener("mousemove",function (e) {
            x = Math.round(e.clientX / window_width * webgl_width);
            y = Math.round((1 - e.clientY / window_height) * webgl_height);
            move(x, y);
        },false);
        canvas.addEventListener("mouseup",function (e) {
            x = Math.round(e.clientX / window_width * webgl_width);
            y = Math.round((1 - e.clientY / window_height) * webgl_height);
            up(x, y);
        },false);
    }
}
/**
 * 按下事件
 * @method 按下事件
 * @for SuuRPG.2d.js
 * @param {int} x 事件点x值
 * @param {int} y 事件点y值
 */
function down(x, y) {
	flag:for (var i = zlayer_keys.length-1; i >=0 ; i--) {
		if (zevent.mode == null) {
			flag0:for (var j = zlayer_keys[i].length-1; j >=0 ; j--) {
				if(zlayer[i][zlayer_keys[i][j]].click) {
					if(zlayer[i][zlayer_keys[i][j]].in_actor(x, y)) {
						zevent.mode = i;
						zevent.key = zlayer_keys[i][j];
						zlayer[i][zevent.key].down(x, y);
						break flag0;
					}
				}
			}
		} else {
			break flag;
		}
	}
}
/**
 * 移动事件
 * @method 移动事件
 * @for SuuRPG.2d.js
 * @param {int} x 事件点x值
 * @param {int} y 事件点y值
 */
function move(x, y) {
	if (zevent.mode != null) {
		zlayer[zevent.mode][zevent.key].move(x, y);
	}
}
/**
 * 松开事件
 * @method 松开事件
 * @for SuuRPG.2d.js
 * @param {int} x 事件点x值
 * @param {int} y 事件点y值
 */
function up(x, y) {
	if (zevent.mode != null) {
		zlayer[zevent.mode][zevent.key].up(x, y);
		zevent.mode = null;
	}
}
/**
 * 添加背景声音
 * @method 添加背景声音
 * @for SuuRPG.2d.js
 * @param {string} filepath 文件地址
 */
function zbaudio(filepath) {
    document.body.removeChild(document.getElementById("background_audio"));
    document.write("<audio id='background_audio' src='" + filepath + "' autoplay='true' loop='loop'></audio>");
}
/**
 * 添加声音
 * @method 添加声音
 * @for SuuRPG.2d.js
 * @param {int} audio_route 声音通道
 * @param {string} filepath 文件地址
 */
function zaudio(audio_route, filepath) {
    document.write("<audio id='audio" + audio_route + "' src='" + filepath + "'></audio>");
    document.getElementById("audio" + audio_route).load();
    document.getElementById("audio" + audio_route).play();
    document.getElementById("audio" + audio_route).addEventListener("ended", function () {
        document.getElementById("audio" + audio_route).pause();
        document.body.removeChild(document.getElementById("audio" + audio_route));
    }, false);
}
/**
 * 添加角色
 * @method 添加角色
 * @for SuuRPG.2d.js
 * @param {int} 层数
 * @param {string} 名字
 * @param {int} x 坐标x值
 * @param {int} y 坐标y值
 * @param {int} width 角色宽度
 * @param {int} height 角色高度
 * @param {string} texture_key 角色纹理ID
 * @param {int} origin_x 组坐标x值(可为空)
 * @param {int} origin_y 组坐标y值(可为空)
 * @param {int} angle 旋转角度值(可为空)
 * @param {int} divide_x 横向切分(可为空)
 * @param {int} divide_y 竖向切分(可为空)
 * @param {int} choose_x 横向分块选择(可为空)
 * @param {int} choose_y 竖向分块选择(可为空)
 */
function zadd(layer, name, x, y,  texture_key, origin_x, origin_y, angle,  divide_x, divide_y, choose_x, choose_y, click, auto_play,end) {

	for(var i = zlayer.length; i < layer; i++){
		zlayer[i] = new Object();
		zlayer_keys[i] = new Array();
	}
    zlayer[layer-1][name] = XActor.op(x, y, origin_x==null?0:origin_x, origin_y==null?0:origin_y, angle==null?0:angle, texture_key, divide_x==null?1:divide_x, divide_y==null?1:divide_y, choose_x==null?1:choose_x, choose_y==null?1:choose_y, click==null?false:click);
    zlayer_keys[layer-1].push(name);
    if (auto_play) {
         zanimation[name] = XFAnimation.op(zlayer[layer-1], name, name,-play_speed,end);
    }
}
/**
 * 删除角色
 * @method 删除角色
 * @for SuuRPG.2d.js
 * @param {object} zmap/zactor/zui
 * @param {string} 名字
 */
function zdel(layer, name) {
    var kcount=-1;
    flag:for (var i = 0; i < zlayer_keys[layer].length;i++) {
        if(zlayer_keys[layer][i] == name) {
            kcount = i;
            break flag;
        }
    }
    if (kcount > -1) {
        delete  zlayer[layer][name];
        zlayer_keys[layer].splice(kcount,1);
    }
}
/**
 * 加载屏幕
 * @method 加载屏幕
 * @for SuuRPG.2d.js
 * @param {json} json 资源加载表
 * @param {function} next_screen 回调屏幕函数
 */
function loading(json, next_screen) {
    webgl_flag = 'loading';
    zfile.clear();
    zanimation = new Object();
    zevent = new Object();
    var loading_flag = 0;
    for (var i = 0; i < json.font.length; i ++) {
        if (!document.getElementById(json.font[i].key)) {
            zfile.font(json.font[i].key,json.font[i].filepath);
        }
    }
    for (var i = 0; i < json.image.length; i ++) {
        zfile.image(json.image[i].key,json.image[i].filepath,loading_flag);
    }
    if (json.font.length > 0) {
        document.fonts.ready.then(function () {
            for (var i = 0; i < json.text.length; i ++) {
                zfile.text(json.text[i].key, json.text[i].font,json.text[i].fontcolor, json.text[i].width, json.text[i].height, json.text[i].text, loading_flag);
            }
            requestAnimationFrame(function () {
                if(loading_flag > 0) {
                    requestAnimationFrame(this);
                } else {
                    next_screen();
                    webgl_flag = 'screen';
                }
            })
        })
    } else {
        for (var i = 0; i < json.text.length; i ++) {
            zfile.text(json.text[i].key, json.text[i].font,  json.text[i].fontcolor, json.text[i].width, json.text[i].height, json.text[i].text, loading_flag);
        }
        requestAnimationFrame(function () {
            if(loading_flag > 0) {
                requestAnimationFrame(this);
            } else {
                next_screen();
                webgl_flag = 'screen';
            }
        })
    }
}