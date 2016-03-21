/******工具类*****************************************************************************/

function formatLatLng(latlng){
	return parseFloat(latlng.lat).toFixed(6) + ',' + parseFloat(latlng.lng).toFixed(6) ;
}

function toQueryString(queryArray){
	var res = "";
	for(var key in queryArray){
		var str = key + "=" + queryArray[key] + "&";
		res += str;
	}
	res = res.substring(0,res.length-1);
	return res;
}

function stringToArray(str){
	var strArray = str.split(';');
	var res = [];
	for (var i = 0; i < strArray.length; i++) {
		var tmp = strArray[i].split(",");
		res.push(bd09towgs84(tmp[0],tmp[1]));
	}
	return res;
}

function displayInfo(infos){
	var info = "<ol class='bd-info'>";
	for (var i = 0; i < infos.length; i++) {
		info = info + "<li>" + infos[i] + "</li>";
	}
	info += "</div>";
	$("#display-info").html(info);
}

function clearInfo(){
	$("#display-info").empty();
}

function hasClass(obj, cls) {  
	return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));  
}
