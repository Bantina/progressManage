$(function() {

	init();
	function init(){
		getServerChart();
		// initChart();
	}
	function getServerChart() {
		$.ajax({
			type: "post",
			url: "http://10.99.1.155:81/Rpc/Supervisord/processNum",
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					initPieChart(res.data);
				}
			}
		})
	}

	// function seriesData(data){
	// 	var series = [];
	// 	var radius = [60, 75];
	// 	var seriesObj = {

	// 	};

	// }

			// {
			// 	name: '服务说一', // tooltip {a}
			// 	type: 'pie',
			// 	// hoverAnimation: false, // 鼠标悬浮动画
			// 	center: ['10%', '32.5%'], // pie 位置
			// 	center: ['30%', '32.5%'],
			// 	radius: radius,
			// 	itemStyle: labelFromatter,
			// 	data: [{
			// 			name: 'other',
			// 			value: 46,
			// 			itemStyle: labelBottom
			// 		}, // name-tooltip {b},value-tooltip {c}
			// 		{
			// 			name: '服务一',
			// 			value: 54,
			// 			itemStyle: labelTop
			// 		} // name-圈内
			// 	]
			// }


		
	function initPieChart(data) {
		var series = [];
		var radius = [60, 75];
		var seriesObj = {
			type: 'pie',
			radius: radius,
			itemStyle: labelFromatter,
		};

		var seriesData = function (data){
			var series = [];
			var radius = [60, 75];
			for(var i=0;i<data.length;i++){
				var total = data[i].open + data[i].close;
				var openPercent = ((data[i].open/total)*100).toFixed(2);
				var closePercent = 100 - openPercent;
				var centerX = (10+i*20)+'%';
				var centerY = i<5?'32.5%':'82.5%';
				var seriesObj = {
					name: data[i].serverName,
					type: 'pie',
					center: [centerX, centerY],
					radius: radius,
					itemStyle: labelFromatter,
					data: [{
						name: '未启用',
						value: closePercent,
						itemStyle: labelBottom
					}, 
					{
						name: data[i].serverName+'已启用',
						value: openPercent,
						itemStyle: labelTop
					}]
				};
				series.push(seriesObj);
			}
			return series;
		}

		var tooltipFormatter = function(svName,isOpen){
			var html = '';
			for(var i=0;i<data.length;i++){
				if(data[i].serverName == svName){
					if(isOpen){
						html = data[i].serverName + '<br>已启用进程：' + data[i].open + '个';
					}else{
						html = data[i].serverName + '<br>未启用进程：' + data[i].close + '个';
					}
					return html;
				}
			}
			return html;
		}
		// Initialize charts
		// ------------------------------
		var multiple_donuts = echarts.init(document.getElementById('multiple_donuts'), EchartTheam);

		// Top text label
		var labelTop = {
			normal: {
				label: {
					show: true,
					position: 'center',
					// formatter: '{b}\n',
					formatter: '{c}%\n',
					textStyle: {
						baseline: 'middle',
						fontWeight: 300,
						fontSize: 15
					}
				},
				labelLine: {
					show: false
				}
			}
		};

		// Format bottom label
		var labelFromatter = {
			normal: {
				label: {
					formatter: function(params) {
						// return '\n\n' + (100 - params.value) + '%'
						return '\n\n启用率'
					}
				}
			}
		}

		// Bottom text label
		var labelBottom = {
			normal: {
				color: '#a4b2bb',
				label: {
					show: true,
					position: 'center',
					textStyle: {
						baseline: 'middle'
					}
				},
				labelLine: {
					show: false
				}
			},
			emphasis: {
				color: '#aebcc5'
			}
		};

		// Set inner and outer radius
		// var radius = [60, 75];

		// Add options
		multiple_donuts_options = {

			// Add title
			title: {
				text: '各服务器 进程启用状态 分布图',
				// subtext: 'from global web index',
				x: 'center'
			},

			// Add legend
			legend: {
				x: 'center',
				y: '56%',
				data: ['服务一', '服务二', '服务三', '服务4', '服务5']
			},

			tooltip: {
				trigger: 'item',
				backgroundColor: 'rgba(0,0,0,0.8)',
				formatter: function(params,ticket,callback) {
					var isOpen = true;
					if(params.name == "未启用"){
						isOpen = false;
					}
					return tooltipFormatter(params.seriesName,isOpen);
				}
			},

			// Add series
			// series: seriesData(data)
			series: [{
				name: '服务说一', // tooltip {a}
				type: 'pie',
				// hoverAnimation: false, // 鼠标悬浮动画
				center: ['10%', '32.5%'], // pie 位置
				radius: radius,
				itemStyle: labelFromatter,
				data: [{
						name: 'other',
						value: 46,
						itemStyle: labelBottom
					}, // name-tooltip {b},value-tooltip {c}
					{
						name: '服务一',
						value: 54,
						itemStyle: labelTop
					} // name-圈内
				]
			}, {
				name: '服务说二',
				type: 'pie',
				center: ['30%', '32.5%'],
				radius: radius,
				itemStyle: labelFromatter,
				data: [{
					name: 'other',
					value: 56,
					itemStyle: labelBottom
				}, {
					name: '服务二',
					value: 44,
					itemStyle: labelTop
				}]
			}, {
				name: '服务说三',
				type: 'pie',
				center: ['50%', '32.5%'],
				radius: radius,
				itemStyle: labelFromatter,
				data: [{
					name: 'other',
					value: 65,
					itemStyle: labelBottom
				}, {
					name: '服务三',
					value: 35,
					itemStyle: labelTop
				}]
			}]

		};



		// Apply options
		// ------------------------------
		multiple_donuts.setOption(multiple_donuts_options);


		// Resize charts
		// ------------------------------

		window.onresize = function() {
			setTimeout(function() {
				multiple_donuts.resize();
			}, 200);
		}
	}










	// 高度计算

	// Charts setup
	//initChart();

	// function initChart() {


	// 	// Initialize charts
	// 	// ------------------------------
	// 	var multiple_donuts = echarts.init(document.getElementById('multiple_donuts'), EchartTheam);

	// 	//
	// 	// Multiple donuts options
	// 	//

	// 	// Top text label
	// 	var labelTop = {
	// 		normal: {
	// 			label: {
	// 				show: true,
	// 				position: 'center',
	// 				// formatter: '{b}\n',
	// 				formatter: '{c}%\n',
	// 				textStyle: {
	// 					baseline: 'middle',
	// 					fontWeight: 300,
	// 					fontSize: 15
	// 				}
	// 			},
	// 			labelLine: {
	// 				show: false
	// 			}
	// 		}
	// 	};

	// 	// Format bottom label
	// 	var labelFromatter = {
	// 		normal: {
	// 			label: {
	// 				formatter: function(params) {
	// 					// return '\n\n' + (100 - params.value) + '%'
	// 					return '\n\n' + 100 + '%'
	// 				}
	// 			}
	// 		}
	// 	}

	// 	// Bottom text label
	// 	var labelBottom = {
	// 		normal: {
	// 			color: '#a4b2bb',
	// 			label: {
	// 				show: true,
	// 				position: 'center',
	// 				textStyle: {
	// 					baseline: 'middle'
	// 				}
	// 			},
	// 			labelLine: {
	// 				show: false
	// 			}
	// 		},
	// 		emphasis: {
	// 			color: '#aebcc5'
	// 		}
	// 	};

	// 	// Set inner and outer radius
	// 	var radius = [60, 75];

	// 	// Add options
	// 	multiple_donuts_options = {

	// 		// Add title
	// 		title: {
	// 			text: '各服务器 进程启用状态 分布图',
	// 			// subtext: 'from global web index',
	// 			x: 'center'
	// 		},

	// 		// Add legend
	// 		legend: {
	// 			x: 'center',
	// 			y: '56%',
	// 			data: ['服务一', '服务二', '服务三', '服务4', '服务5']
	// 		},

	// 		tooltip: {
	// 			trigger: 'item',
	// 			backgroundColor: 'rgba(0,0,0,0.8)',
	// 			// formatter: "{a} <br/>{b}: {c} ({d}%)"
	// 			formatter: function(params) {
	// 				var str = '<p>' + params.seriesName + '</p>' + '<p>' + params.name + ': ' + params.value + '个</p>';
	// 				return str;
	// 			}
	// 		},

	// 		// Add series
	// 		series: [{
	// 			name: '服务说一', // tooltip {a}
	// 			type: 'pie',
	// 			// hoverAnimation: false, // 鼠标悬浮动画
	// 			center: ['10%', '32.5%'], // pie 位置
	// 			radius: radius,
	// 			itemStyle: labelFromatter,
	// 			data: [{
	// 					name: 'other',
	// 					value: 46,
	// 					itemStyle: labelBottom
	// 				}, // name-tooltip {b},value-tooltip {c}
	// 				{
	// 					name: '服务一',
	// 					value: 54,
	// 					itemStyle: labelTop
	// 				} // name-圈内
	// 			]
	// 		}, {
	// 			name: '服务说二',
	// 			type: 'pie',
	// 			center: ['30%', '32.5%'],
	// 			radius: radius,
	// 			itemStyle: labelFromatter,
	// 			data: [{
	// 				name: 'other',
	// 				value: 56,
	// 				itemStyle: labelBottom
	// 			}, {
	// 				name: '服务二',
	// 				value: 44,
	// 				itemStyle: labelTop
	// 			}]
	// 		}, {
	// 			name: '服务说三',
	// 			type: 'pie',
	// 			center: ['50%', '32.5%'],
	// 			radius: radius,
	// 			itemStyle: labelFromatter,
	// 			data: [{
	// 				name: 'other',
	// 				value: 65,
	// 				itemStyle: labelBottom
	// 			}, {
	// 				name: '服务三',
	// 				value: 35,
	// 				itemStyle: labelTop
	// 			}]
	// 		}, {
	// 			type: 'pie',
	// 			center: ['70%', '32.5%'],
	// 			radius: radius,
	// 			itemStyle: labelFromatter,
	// 			data: [{
	// 				name: 'other',
	// 				value: 70,
	// 				itemStyle: labelBottom
	// 			}, {
	// 				name: '服务4',
	// 				value: 30,
	// 				itemStyle: labelTop
	// 			}]
	// 		}, {
	// 			type: 'pie',
	// 			center: ['90%', '32.5%'],
	// 			radius: radius,
	// 			itemStyle: labelFromatter,
	// 			data: [{
	// 				name: 'other',
	// 				value: 73,
	// 				itemStyle: labelBottom
	// 			}, {
	// 				name: '服务5',
	// 				value: 27,
	// 				itemStyle: labelTop
	// 			}]
	// 		}]

	// 	};



	// 	// Apply options
	// 	// ------------------------------
	// 	multiple_donuts.setOption(multiple_donuts_options);


	// 	// Resize charts
	// 	// ------------------------------

	// 	window.onresize = function() {
	// 		setTimeout(function() {
	// 			multiple_donuts.resize();
	// 		}, 200);
	// 	}
	// }
});