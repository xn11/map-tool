/**web服务的key值**/

var baidu_ak = "rnFk0NhFaSRv7b6rXH1dpNAN";
// var Lbs_key = "2ad58dd1832ce97111bf2f62921a968c";
var webServices = CONFIG.webServices;

function getRouteJson(routeIndex, startMarker, endMarker){
	var route = CONFIG.routings[routeIndex];

	switch(route.provider){
	case "lbs":
		getLbsJson(route.routeType, startMarker, endMarker);
		break;
	case "baidu":
		getBdJson(route.routeType, route.routeOptions, startMarker, endMarker);
		break;
	case 'hana':
		getHanaJson(startMarker,endMarker);
		break;
	case 'osrm':
		break;
	default:
		break;

	}
}


//获取高德驾车/步行线路json  lng,lat
function getLbsJson(type,startMarker,endMarker){
	var json = [];
	//地球坐标转成火星坐标
	var startPoint = wgs84togcj02(startMarker.getLatLng().lng, startMarker.getLatLng().lat);
	var endPoint = wgs84togcj02(endMarker.getLatLng().lng, endMarker.getLatLng().lat);

	json.push([startMarker.getLatLng().lng, startMarker.getLatLng().lat]);

	//动态加载高德js脚本
	var url = webServices.lbs.url;
	$.getScript(url).done(function() {
		AMap.service(["AMap." + type], function() {
			var options = { 
				panel: 'display-info',                     
				/*policy: AMap.DrivingPolicy.LEAST_TIME */
			};

		//构造类
		var lbs_class;
		if(type == "Driving"){
			lbs_class = new AMap.Driving(options);
		}
		if(type == "Walking"){
			lbs_class = new AMap.Walking(options);
		}

        //根据起、终点坐标查询路线
        lbs_class.search(startPoint, endPoint, function(status, result){
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
function getBdJson(type,options,startMarker,endMarker){
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
	// options.sort();

	var queryString = toQueryString(options);
	var url = webServices.baidu.url + queryString;

	$.ajax({
		url:url,
		dataType:"jsonp"
	}).done(function(data) {
		var json = [];
		var instruction = [];
		var steps = data.result.routes[0].steps;
		json.push(startPoint);
		for (var i = 0; i < steps.length; i++) {
			json = json.concat(stringToArray(steps[i].path));
			instruction.push(steps[i].instructions);
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
	const hostname = CONFIG.hana.hostname;
	const port = CONFIG.hana.port;
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
