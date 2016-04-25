/**web服务的key值**/

// var baidu_ak = "rnFk0NhFaSRv7b6rXH1dpNAN";
// var gaode_key = "2ad58dd1832ce97111bf2f62921a968c";
var webServices = CONFIG.webServices;

//callName为调用reRoute的方法名
function getRouteJson(routeIndex, callName){
    var route = CONFIG.routings[routeIndex];

    switch(route.provider){
        case "gaode":
            getGaodeJson(route.routeType);
            break;
        case "baidu":
            getBdJson(route.routeType, route.routeOptions);
            break;
        case 'hana':
            getHanaJson();
            break;
        case 'osrm':
            getOsrmJson(callName);
            break;
        case 'myroute':
            getMyrouteJson(callName);
            break;
        default:
            break;
    }

    return webServices[route.provider];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
/*
* 获取高德驾车/步行线路json  
* lng,lat
*/
function getGaodeJson(type){
    var json = [];
    //地球坐标转成火星坐标
    var startPoint = wgs84togcj02(startMarker.getLatLng().lng, startMarker.getLatLng().lat);
    var endPoint = wgs84togcj02(endMarker.getLatLng().lng, endMarker.getLatLng().lat);

    //途经点
    var waypoints = new Array();
    for (var i = 0; i < viaMarkers.length; i++) {
        waypoints.push(wgs84togcj02(viaMarkers[i].getLatLng().lng,viaMarkers[i].getLatLng().lat));
    };

    json.push([startMarker.getLatLng().lng, startMarker.getLatLng().lat]);

    //动态加载高德js脚本
    var url = webServices.gaode.url + "key=" + webServices.gaode.key;
    $.getScript(url).done(function() {
        AMap.service(["AMap." + type], function() {
            var options = { 
                panel: 'display-info',                     
                /*policy: AMap.DrivingPolicy.LEAST_TIME */
            };

        //构造类
        var gaode_class;
        if(type == "Driving"){
            gaode_class = new AMap.Driving(options);
        }
        if(type == "Walking"){
            gaode_class = new AMap.Walking(options);
        }

        //根据起、终点坐标查询路线
        gaode_class.search(startPoint, endPoint, {"waypoints":waypoints}, function(status, result){
        // gaode_class.search(waypoints, function(status, result){
            var steps = result.routes[0].steps;

            for (var i = 0; i < steps.length; i++) {

                var path = steps[i].path;
                for (var j = 0; j < path.length; j++) {
                    json.push(gcj02towgs84(path[j].lng,path[j].lat));   //火星坐标转地球坐标
                };

                // json.push(gcj02towgs84(endLoc.lng, endLoc.lat));     //火星坐标转地球坐标
            };          

            json.push([endMarker.getLatLng().lng, endMarker.getLatLng().lat]);
            drawGeojson(json);
        });
    });
})

}

///////////////////////////////////////////////////////////////////////////////////////////////////
/*
* 百度导航路线json  
* lat,lng
*/
function getBdJson(type,options){
    var json = [];
    // var query = new Array();
    // query["mode"] = type;
    // query["origin_region"] = "南京";
    // query["destination_region"] = "南京";
    // query["output"] = "json";
    // query["ak"] = baidu_ak;
    // query["coord_type"] = "wgs84";   //设置坐标系
    // query["tactics"] = 12; //导航路线类型:10-不走高速；11-最少时间；12-最短路径(默认)

    //origin_region,destination_region,tactics已经在CONFIG中配置了
    options["mode"] = type;
    options["ak"] = webServices.baidu.key;
    options["output"] = "json";
    options["coord_type"] = "wgs84";    //设置坐标系
    
    var startPoint = [startMarker.getLatLng().lng, startMarker.getLatLng().lat];
    var endPoint = [endMarker.getLatLng().lng, endMarker.getLatLng().lat];

    options["origin"] = startPoint[1] + "," + startPoint[0];
    options["destination"] = endPoint[1] + "," + endPoint[0];

    //途经点
    if("waypoints" in options){     //清空waypoints属性
        delete options.waypoints;
    }
    if(viaMarkers.length > 0){
        var waypoints = "";
        for (var i = 0; i < viaMarkers.length; i++) {
            waypoints = waypoints + viaMarkers[i].getLatLng().lat + "," + viaMarkers[i].getLatLng().lng + "|";
        };
        waypoints = waypoints.substring(0,waypoints.length-1);
        options["waypoints"] = waypoints;
    }
    
    // options.sort();

    var queryString = toQueryString(options);
    var url = webServices.baidu.url + queryString;

    $.ajax({
        url:url,
        dataType:"jsonp"
    }).done(function(data) {
        if (data.status == 0) { 
            var json = [];
            var instruction = [];
            json.push(startPoint);

            for (var i = 0; i < data.result.routes.length; i++) { //百度返回码中的routes数组是多段路径的集合，需要遍历拼接！！
                var steps = data.result.routes[i].steps;

                for (var j = 0; j < steps.length; j++) {
                    json = json.concat(stringToArray(steps[j].path));
                    instruction.push(steps[j].instructions);
                };
            };
            json.push(endPoint);

            var extras = [];
            extras.push("总时长：" + data.result.taxi.duration + "s | 总距离：" + data.result.taxi.distance + "m");

            displayInfo(instruction, "", extras);
            drawGeojson(json);
        }else{
            clearInfo();
        }
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////
/*
* Hana调C++方法  
* lat,lng
*/
function getHanaJson(){
    var startPoint = [startMarker.getLatLng().lat, startMarker.getLatLng().lng];
    var endPoint = [endMarker.getLatLng().lat, endMarker.getLatLng().lng];

    var query = new Array();
    query["startLat"] = startMarker.getLatLng().lat;
    query["startLng"] = startMarker.getLatLng().lng;
    query["endLat"] = endMarker.getLatLng().lat;
    query["endLng"] = endMarker.getLatLng().lng;

    var queryString = toQueryString(query); 
    const hostname = webServices.hana.hostname;
    const port = webServices.hana.port;
    var url = "http://" + hostname + ":" + port + "?" + queryString;

    $.ajax({
        url:url,
        dataType:"jsonp",
        jsonp:"callback",
        jsonpCallback:"success_jsonpCallback"
    }).done(function(data) {
        var json = [];
        var instruction = [];

        var res = data.res.split(',');
        json.push([res[0],res[1]]);
        json.push([res[2],res[3]]);

        displayInfo(instruction);
        drawGeojson(json);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////
/*
 * Myroute导航路线json  
 * lat,lng
*/
function getMyrouteJson(callName){
    var json = [];

    var options = [];
    options["jsonp"] = "myrouteCallback";

    var queryString = toQueryString(options);
    queryString = queryString + "&loc=" + formatLatLng(startMarker.getLatLng());
    for (var i = 0; i < viaMarkers.length; i++) {
        queryString = queryString + "&loc=" + formatLatLng(viaMarkers[i].getLatLng());
    }
    queryString = queryString + "&loc=" + formatLatLng(endMarker.getLatLng());

    var url = webServices.myroute.url + queryString;

    // 清除已经载入的脚本，添加新的节点
    $("script[id *= 'myroutescript']").remove();
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.id = "myroutescript_" + callName;   //传递callName
    document.head.appendChild(script);      
}

//回调函数
function myrouteCallback(data){

    var extras = [];
    extras.push("<td>Service time:</td><td><b>" + data.service_time + "</b></td><td>s</td>");
    extras.push("<td>Service core time:</td><td><b>" + data.service_core_time + "</b></td><td>s</td>");
    extras.push("<td>Search steps:</td><td><b>" + data.search_steps + "</b></td></td><td>");
                
    if (data.status == 0) {
        var routes = data.result_route;
        var json = [];
        for (var i = 0; i < routes.length; i++) {
            json.push([routes[i][1],routes[i][0]]);
        }
// var extra = "总距离：" + data.length_km.toFixed(2) + "km | 服务时间： " + data.service_time + "s | 核心服务时间： " + data.service_core_time + "s | 步骤数： " + data.search_steps;
        extras.unshift( "<td>Distance：</td><td><b>" + data.length_km.toFixed(2) + "</b></td><td>km</td>");
        displayInfo(null, "", extras);
        drawGeojson(json);
    }
    else {
        displayInfo(null, data.status_message, extras);
    }

    //如果调用事件不为拖拽中,则重置marker位置，将marker放置在路段上
    // if($("script[id *= 'osrmscript']").attr("id") != "osrmscript_dragstartMarker"){
    //  resetMarker(0, data.via_points[0]);
    //  resetMarker(1, data.via_points[data.via_points.length - 1]);
    // }

    //如果调用事件为拖拽结束，则重置viaMarker
    if($("script[id *= 'myroutescript']").attr("id") == "osrmscript_dragendMarker"){
        resetMarker(0, data.via_points[0]);
        resetMarker(1, data.via_points[data.via_points.length - 1]);
        document.getElementById("start-input").value = formatLatLng(startMarker.getLatLng());
        document.getElementById("end-input").value = formatLatLng(endMarker.getLatLng());

        for (var i = 1; i < data.via_points.length - 1; i++) {
            resetMarker( -i, data.via_points[i]);
        };      
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
/*
* OSRM导航路线json  
* lat,lng
*/
function getOsrmJson(callName){
    var json = [];

    var options = [];
    options["output"] = "json";
    options["jsonp"] = "osrmCallback";
    options["instructions"] = "true";

    var queryString = toQueryString(options);
    queryString = queryString + "&loc=" + formatLatLng(startMarker.getLatLng());
    for (var i = 0; i < viaMarkers.length; i++) {
        queryString = queryString + "&loc=" + formatLatLng(viaMarkers[i].getLatLng());
    }
    queryString = queryString + "&loc=" + formatLatLng(endMarker.getLatLng());

    var url = webServices.osrm.url + queryString;

    // 清除已经载入的osrm脚本，添加新的节点
    $("script[id *= 'osrmscript']").remove();
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.id = "osrmscript_" + callName;   //传递callName
    document.head.appendChild(script);      
}
//回调函数
function osrmCallback(data){
    // if (data.status == 0) { 
        var routes = osrm_decode(data.route_geometry, 6);   //解码    
        var json = [];
        for (var i = 0; i < routes.length; i++) {
            json.push([routes[i][1],routes[i][0]]);
        }

        var instructions = data.route_instructions;
        var instruction = [];
        for (var i = 0; i < instructions.length; i++) {
            instruction.push(osrm_buildInstruction(instructions[i]));
        };

        var title = data.route_summary.start_point + " > " + data.route_summary.end_point;
        var extras = [];
        extras.push("总时长：" + data.route_summary.total_time + "s | 总距离：" + data.route_summary.total_distance + "m");
        displayInfo(instruction, title, extras);
        drawGeojson(json);
    // }else{
    //     clearInfo();
    // }

    //如果调用事件不为拖拽中,则重置marker位置，将marker放置在路段上
    // if($("script[id *= 'osrmscript']").attr("id") != "osrmscript_dragstartMarker"){
    //  resetMarker(0, data.via_points[0]);
    //  resetMarker(1, data.via_points[data.via_points.length - 1]);
    // }

    //如果调用事件为拖拽结束，则重置viaMarker
    if($("script[id *= 'osrmscript']").attr("id") == "osrmscript_dragendMarker"){
        resetMarker(0, data.via_points[0]);
        resetMarker(1, data.via_points[data.via_points.length - 1]);
        document.getElementById("start-input").value = formatLatLng(startMarker.getLatLng());
        document.getElementById("end-input").value = formatLatLng(endMarker.getLatLng());

        for (var i = 1; i < data.via_points.length - 1; i++) {
            resetMarker( -i, data.via_points[i]);
        };      
    }
}
//osrm解码
//decode compressed route geometry 
function osrm_decode(encoded, precision) {
    precision = Math.pow(10, -precision);
    var len = encoded.length, index=0, lat=0, lng = 0, array = [];
    while (index < len) {
        var b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;
        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;
        //array.push( {lat: lat * precision, lng: lng * precision} );
        array.push( [lat * precision, lng * precision] );
    }
    return array;
}
//构造instruction信息
function osrm_buildInstruction(info){
    var res = osrm_instruction["DIRECTION_" + info[0]];
    res = res.replace(/%s/, info[1]).replace(/%d/, osrm_instruction[info[6]]).replace(/%m/, info[2] + "米");
    return res;
}
//osrm instruction对应文字
var osrm_instruction = {
    // directions
    "N": "向北",
    "E": "向东",
    "S": "向南",
    "W": "向西",
    "NE": "东北",
    "SE": "东南",
    "SW": "西南",
    "NW": "西北",
    // driving directions
    // %s: road name
    // %d: direction
    // %m: distance
    "DIRECTION_0":"进入<b>%s</b>",
    "DIRECTION_1":"继续行驶%m",
    "DIRECTION_2":"稍向右转进入<b>%s</b>，行驶%m",
    "DIRECTION_3":"右转进入<b>%s</b>，行驶%m",
    "DIRECTION_4":"向右急转进入<b>%s</b>，行驶%m",
    "DIRECTION_5":"掉头进入<b>%s</b>，行驶%m",
    "DIRECTION_6":"向左急转进入<b>%s</b>，行驶%m",
    "DIRECTION_7":"左转进入<b>%s</b>，行驶%m",
    "DIRECTION_8":"稍向左转进入<b>%s</b>，行驶%m",
    "DIRECTION_10":"沿<b>%d</b>方向进入<b>%s</b>，行驶%m",
    "DIRECTION_11-1":"进入环状交叉路并在第1个出口离开，进入<b>%s</b>,，行驶%m",
    "DIRECTION_11-2":"进入环状交叉路并在第2个出口离开，进入<b>%s</b>，行驶%m",
    "DIRECTION_11-3":"进入环状交叉路并在第3个出口离开，进入<b>%s</b>，行驶%m",
    "DIRECTION_11-4":"进入环状交叉路并在第4个出口离开，进入<b>%s</b>，行驶%m",
    "DIRECTION_11-5":"进入环状交叉路并在第5个出口离开，进入<b>%s</b>，行驶%m",
    "DIRECTION_11-6":"进入环状交叉路并在第6个出口离开，进入<b>%s</b>，行驶%m",
    "DIRECTION_11-7":"进入环状交叉路并在第7个出口离开，进入<b>%s</b>，行驶%m",
    "DIRECTION_11-8":"进入环状交叉路并在第8个出口离开，进入<b>%s</b>，行驶%m",
    "DIRECTION_11-9":"进入环状交叉路并在第9个出口离开，进入<b>%s</b>，行驶%m",
    "DIRECTION_11-x":"进入环状交叉路并从出口离开，进入<b>%s</b>，行驶%m",
    "DIRECTION_15":"到达终点"
}
