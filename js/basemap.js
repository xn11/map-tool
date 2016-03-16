
//从localstorage中获取自定义底图URL
function getURL(){
	var mbAttr = '&copy; SAP NIC';

	var baseLayers = new Array();
	for (var i = 0; i < CONFIG.baseMaps.length; i++) {
		var baseMap = CONFIG.baseMaps[i];
		baseLayers[baseMap.name] = L.tileLayer(baseMap.url, {attribution: mbAttr});
	};

	var storage = window.localStorage;
	for (var i = 0; i < storage.length; i++) {
		var url = storage.key(i);
		if(url.indexOf(".png")<0){
			continue;
		}
		var name = storage.getItem(url);

		baseLayers[name] = L.tileLayer(url, {attribution: mbAttr});	
		
	};
	return baseLayers;
}

function clearURL(){
	window.localStorage.clear();
	alert("清空成功！");
	window.location.reload();	//刷新页面
}

function addURL(){
	var name = document.getElementById("name-input").value.trim();
	var url = document.getElementById("url-input").value.trim();

	if(url == "" || url.indexOf(".png") < 0){
		$("#url-input").addClass("empty-input");
		return;
	}else{
		$("#url-input").removeClass("empty-input");
	}

	if(name==""){
		name = url.length <= 25? url: url.substring(0, 25);
	}

	var storage = window.localStorage;
	storage.setItem(url, name);	

	alert(storage.getItem(url) + "添加成功！");
	window.location.reload();	//刷新页面
}