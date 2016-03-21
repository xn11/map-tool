/**web服务的key值**/

// var baidu_ak = "rnFk0NhFaSRv7b6rXH1dpNAN";
// var gaode_key = "2ad58dd1832ce97111bf2f62921a968c";
var webServices = CONFIG.webServices;

function getRouteJson(routeIndex, startMarker, endMarker, viaMarkers){
	var route = CONFIG.routings[routeIndex];

	switch(route.provider){
	case "gaode":
		getGaodeJson(route.routeType, startMarker, endMarker,viaMarkers);
		break;
	case "baidu":
		getBdJson(route.routeType, route.routeOptions, startMarker, endMarker,viaMarkers);
		break;
	case 'hana':
		getHanaJson(startMarker,endMarker);
		break;
	case 'osrm':
		getOsrmJson(startMarker, endMarker,viaMarkers);
		break;
	default:
		break;
	}

	return webServices[route.provider];
}


//获取高德驾车/步行线路json  lng,lat
function getGaodeJson(type,startMarker,endMarker,viaMarkers){
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
        			json.push(gcj02towgs84(path[j].lng,path[j].lat));	//火星坐标转地球坐标
        		};

        		// json.push(gcj02towgs84(endLoc.lng, endLoc.lat)); 	//火星坐标转地球坐标
        	};        	

        	json.push([endMarker.getLatLng().lng, endMarker.getLatLng().lat]);
        	drawGeojson(json);
        });
    });
	})
	
}

//百度导航路线json  lat,lng
function getBdJson(type,options,startMarker,endMarker,viaMarkers){
	var json = [];
	// var query = new Array();
	// query["mode"] = type;
	// query["origin_region"] = "南京";
	// query["destination_region"] = "南京";
	// query["output"] = "json";
	// query["ak"] = baidu_ak;
	// query["coord_type"] = "wgs84";	//设置坐标系
	// query["tactics"] = 12; //导航路线类型:10-不走高速；11-最少时间；12-最短路径(默认)

	//origin_region,destination_region,tactics已经在CONFIG中配置了
	options["mode"] = type;
	options["ak"] = webServices.baidu.key;
	options["output"] = "json";
	options["coord_type"] = "wgs84";	//设置坐标系
	
	var startPoint = [startMarker.getLatLng().lng, startMarker.getLatLng().lat];
	var endPoint = [endMarker.getLatLng().lng, endMarker.getLatLng().lat];

	options["origin"] = startPoint[1] + "," + startPoint[0];
	options["destination"] = endPoint[1] + "," + endPoint[0];

	//途经点
	if("waypoints" in options){		//清空waypoints属性
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
		var json = [];
		var instruction = [];
		json.push(startPoint);

		for (var i = 0; i < data.result.routes.length; i++) {		//百度返回码中的routes数组是多段路径的集合，需要遍历拼接！！
			var steps = data.result.routes[i].steps;

			for (var j = 0; j < steps.length; j++) {
				json = json.concat(stringToArray(steps[j].path));
				instruction.push(steps[j].instructions);
			};
		};
		json.push(endPoint);
		displayInfo(instruction);
		drawGeojson(json);
	});
}

//Hana调C++方法  lat,lng
function getHanaJson(startMarker,endMarker){
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



//OSRM导航路线json  lat,lng
function getOsrmJson(startMarker,endMarker,viaMarkers){
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

	// add script to DOM
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;
	document.head.appendChild(script);		

}

function osrmCallback(data){
	var routes = osrm_decode(data.route_geometry, 6);
	var json = [];
	// displayInfo(instruction);

	for (var i = 0; i < routes.length; i++) {
		json.push([routes[i][1],routes[i][0]]);
	};

	drawGeojson(json);

	//参考OSRM.Localization文件的direction——————————————————————————————————————————————————————————————————

	// console.log(data);
	console.log(data.route_instructions[0].toString());
}


//decode compressed route geometry osrm解码
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
