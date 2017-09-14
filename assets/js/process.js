$(function() {

	//全局变量；
	var SERVER = '';
	var PRO_datatable;

	// 初始化；
	init();

	function init() {
		getProgressData(true);
	}
	// 默认设置 datatable
	$.extend($.fn.dataTable.defaults, {
		autoWidth: false,
		dom: '<"datatable-header"fl><"datatable-scroll"t><"datatable-footer"ip>',
		language: {
			search: '<span>查询:</span> _INPUT_',
			lengthMenu: '<span>Show:</span> _MENU_',
			paginate: {
				'first': 'First',
				'last': 'Last',
				'next': '&rarr;',
				'previous': '&larr;'
			}
		},
		drawCallback: function() {
			$(this).find('tbody tr').slice(-3).find('.dropdown, .btn-group').addClass('dropup');
		},
		preDrawCallback: function() {
			$(this).find('tbody tr').slice(-3).find('.dropdown, .btn-group').removeClass('dropup');
		}
	});

/*
	 * 服务器 所有进程列表数据展示
	 * @programs 数组，包含服务器名svName 的进程数组;
	 */
	function progressDatatable(programs) {
		var rows = [];
		for (var i = 0; i < programs.length; i++) {
			var row = {};
			row.svName = '<a class="td_pro_server">' + programs[i].svName + '</a>';
			row.busyName = '<a class="td_pro_business">' + programs[i].busyName + '</a>';
			row.proName = '<a class="td_pro_progress">' + programs[i].group + ':' + programs[i].name + '</a>';
			row.proDesc = programs[i].description;
			if (programs[i].state == 20) { // running
				row.proState = '<span class="label label-success">' + programs[i].statename + '</span>';
			} else if (programs[i].state == 0) { // stopped
				row.proState = '<span class="label label-danger">' + programs[i].statename + '</span>';
			} else {
				row.proState = '<span class="label label-info">' + programs[i].statename + '</span>';
			}
			rows.push(row);
		};

		PRO_datatable = $('.datatable_progress').DataTable({
			data: rows,
			destroy: true,
			columns: [{
				data: 'svName'
			}, {
				data: 'busyName'
			}, {
				data: 'proName'
			}, {
				data: 'proDesc'
			}, {
				data: 'proState'
			}],
			columnDefs: [{
				orderable: false,
				targets: [4]
			}, {
				orderable: false,
				targets: [5],
				data: null
				defaultContent: [
					'<a class="pro-action td_action_start" href="#">启动</a>',
					'<a class="pro-action td_action_stop" href="#">停止</a>',
					'<a class="pro-action td_action_restart" href="#">重启</a>',
					'<a class="pro-action td_action_edit" href="#">修改配置</a>',
					'<a class="pro-action td_action_reload" href="#">重载</a>',
					'<a class="pro-action td_action_delete" href="#">删除</a>'
				].join('')
			}],
		});

	}

	/*
	 * 进程所有数据
	 * @appendFlag 是否追加到筛选菜单html
	 */
	function getProgressData(appendFlag) {
		var data = [];
		$.ajax({
			type: "get",
			url: "http://10.99.1.155:81/Rpc/Supervisord/index",
			dataType: 'json',
			success: function(json) {
				if (json.status == 1) {
					var serverHtml = '';
					var programs = [];
					for (var i in json.data) { // 服务器级
						serverHtml += '<li><a class="navigation_server_a" href="#"><i class="icon-server"></i>' + json.data[i].serverName + '</a></li>';
						var businessName = json.data[i].business.business;
						for (var j = 0; j < businessName.length; j++) { // 业务级
							for (var k = 0; k < json.data[i].business[businessName[j]].length; k++) { // 进程级
								json.data[i].business[businessName[j]][k].svName = json.data[i].serverName;
								json.data[i].business[businessName[j]][k].busyName = businessName[j];
								programs.push(json.data[i].business[businessName[j]][k]);
							}
						}
					}
					progressDatatable(programs);

					if (appendFlag) { // 服务筛选二级菜单；
						$('.navigation_server').append(serverHtml);
					}
				} else {
					alert(json.data);
				}
			}
		})
	}

	/*
	 * 获取 单个服务下进程数据
	 * @appendFlag 是否追加到筛选菜单html
	 */
	function getServerProgressData() {
		$.ajax({
			type: "get",
			url: "http://10.99.1.155:81/Rpc/Supervisord/serverInfo",
			data: {
				serverName: SERVER
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					var programs = [];
					var businessName = res.data.business.business;
					for (var j = 0; j < businessName.length; j++) { // 业务级
						for (var k = 0; k < res.data.business[businessName[j]].length; k++) { // 进程级
							res.data.business[businessName[j]][k].svName = res.data.serverName;
							res.data.business[businessName[j]][k].busyName = businessName[j];
							programs.push(res.data.business[businessName[j]][k]);
						}
					}
					progressDatatable(programs);
				} else {
					alert(res.data);
				}
			}
		})
	}
	// 服务筛选：获取某一server下的的所有进程
	$('.navigation_server').on('click', '.navigation_server_a', function() {
		var _this = $(this);
		SERVER = _this.text();
		// var serverName = _this.text();
		if (SERVER == '') return;
		getServerProgressData();
		$('.pro-nav-toggle').css({
			'display': 'inline-block'
		});
		_this.addClass('active');
		_this.parent().siblings().find('a').removeClass('active');

	});

	// 获取 所有进程
	$('.navigation_server_all').on('click', function() {
		getProgressData(false);
		SERVER = '';
		$('.pro-nav-toggle').css({
			'display': 'none'
		});
		$(this).addClass('active');
		$(this).parent().siblings().find('a').removeClass('active');
	})

	// 表头点击事件；
	// 某一服务进程 全部启动 
	$('.pro_startAll').on('click', function() {
		if (SERVER == '') return;
		$.ajax({
			type: "post",
			url: "http://10.99.1.155:81/Rpc/Programs/startAll",
			data: {
				serverName: SERVER
			},
			dataType: 'json',
			success: function(res) {
				var table_rows = PRO_datatable.rows().data();
				if (res.status == '1') { // 启动成功；
					alert('全部启动成功');
					for (var i = 0; i < table_rows.length; i++) { // 状态修改
						table_rows[i].proState = '<span class="label label-success">running</span>';
					};
					PRO_datatable.rows().invalidate().draw(); // 表格重绘，必须加 invalidate();
				} else {
					alert('启动失败');
				}
			}
		})
	})

	// 某一服务进程 全部停止
	$('.pro_stopAll').on('click', function() {
		if (SERVER == '') return;
		$.ajax({
			type: "post",
			url: "http://10.99.1.155:81/Rpc/Programs/stopAll",
			data: {
				serverName: SERVER
			},
			dataType: 'json',
			success: function(res) {
				var table_rows = PRO_datatable.rows().data();
				if (res.status == '1') {
					alert('全部停止成功');
					for (var i = 0; i < table_rows.length; i++) { // 状态修改
						table_rows[i].proState = '<span class="label label-danger">stopped</span>';
					};
					PRO_datatable.rows().invalidate().draw(); // 表格重绘，必须加 invalidate();
				} else {
					alert('停止失败');
				}
			}
		})
	})

	// 添加进程
	$('#addProgress').on('click', function() {
		var pro_server = $('.pro_server'),
			pro_business = $('.pro_business'),
			pro_worker = $('.pro_worker'),
			pro_order = $('.pro_order'),
			pro_user = $('.pro_user'),
			pro_num = $('.pro_num'),
			pro_name = $('.pro_name');
		var isPositiveInteger = /^[0-9]*[1-9][0-9]*$/, // 是否为正整数
			isInteger = /^[0-9]+.?[0-9]*$/; // 是否为数字

		if (pro_server.val() == '' || pro_server.val().length > 20) {
			alert('服务器名 必须在1-20个字数内');
			pro_server.forcus();
		} else if (pro_business.val() == '' || pro_business.val().length > 20) {
			alert('进程名 必须在1-20个字数内');
		} else if (pro_worker.val() == '' || pro_worker.val().length > 20) {
			alert('worker标识 必须在1-20个字数内');
		} else if (!isNaN(pro_worker.val())) {
			alert('worker标识不能为纯数字');
		} else if (pro_num.val() == '' || !isPositiveInteger.test(pro_num.val()) || pro_num.val() == 0) {
			alert('进程数量 必须是大于0的正整数');
		} else {
			$.ajax({
				type: "post",
				url: "http://10.99.1.155:81/Configure/Configure/doAddWorker",
				async: true,
				data: {
					mainBusiness: pro_server.val(),
					subBusiness: pro_business.val(),
					workerName: pro_worker.val(),
					command: pro_order.val(),
					user: pro_user.val(),
					numprocs: pro_num.val(),
					process_name: pro_name.val()
				},
				dataType: 'json',
				success: function(res) {
					if (res.status == 1) {
						alert('suc');
					} else if (res.status == 0) {
						if (typeof res.data != "object") {
							alert(res.data);
						} else {
							alert(res.data[0]); // 取到对象的第一个属性，之后的状态。。。。
						}
					}

				}
			})
		}
	})



	// 表格点击事件
	// 获取某一服务详情
	$('.datatable_progress').on('click', '.td_pro_server', function() {
		var serverName = $(this).text();
		$.ajax({
			type: "post",
			url: "http://10.99.1.155:81/Rpc/Supervisord/serverState",
			data: {
				serverName: serverName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					$('.serverDetail_name').val(serverName);
					$('.serverDetail_apiVersion').val(res.data.apiVersion);
					$('.serverDetail_identi').val(res.data.identification);
					$('.serverDetail_state').val(res.data.state.statename);
					$('#serverDetailModal').modal('show');
				}
			}
		})
	})

	// 单个进程启动
	$('.datatable_progress').on('click', '.td_action_start', function() {
		var targP = $(this).parent().parent();
		var serverName = targP.find('.td_pro_server').text();
		var workerName = targP.find('.td_pro_progress').text();
		$.ajax({
			type: "post",
			url: "http://10.99.1.155:81/Rpc/Programs/startProcess",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					targP.children().eq(4).html('<span class="label label-success">running</span>');
				} else {
					alert(res.data);
				}
			}
		})
	})

	//单个进程停止
	$('.datatable_progress').on('click', '.td_action_stop', function() {
		var targP = $(this).parent().parent();
		var serverName = targP.find('.td_pro_server').text();
		var workerName = targP.find('.td_pro_progress').text();
		$.ajax({
			type: "post",
			url: "http://10.99.1.155:81/Rpc/Programs/stopProcess",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					targP.children().eq(4).html('<span class="label label-danger">stopped</span>');
				} else {
					alert(res.data);
				}
			}
		})
	})

	//单个进程重启
	$('.datatable_progress').on('click', '.td_action_restart', function() {
		var targP = $(this).parent().parent();
		var serverName = targP.find('.td_pro_server').text();
		var workerName = targP.find('.td_pro_progress').text();
		$.ajax({
			type: "post",
			url: "http://10.99.1.155:81/Rpc/Programs/restartProcess",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					alert('success');
				} else {
					alert(res.data);
				}
			}
		})
	})

	//单个进程重载
	$('.datatable_progress').on('click', '.td_action_reload', function() {
		var targP = $(this).parent().parent();
		var serverName = targP.find('.td_pro_server').text();
		var workerName = targP.find('.td_pro_progress').text();
		$.ajax({
			type: "post",
			url: "http://10.99.1.155:81/Rpc/Programs/reload",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					alert('success');
				} else {
					alert(res.data);
				}
			}
		})
	})

	//单个进程删除
	$('.datatable_progress').on('click', '.td_action_delete', function() {
		var targP = $(this).parent().parent();
		var serverName = targP.find('.td_pro_server').text();
		var busyName = targP.find('.td_pro_business').text();
		var workerName = targP.find('.td_pro_progress').text();

		$.ajax({
			type: "post",
			url: "http://10.99.1.155:81/Configure/Configure/doDeleteWorker",
			data: {
				serverName: serverName,
				business: busyName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					alert('success');
				} else {
					alert(res.data);
				}
			}
		})
	})

	// 数据刷新；
	$('.pro_refreshAll').on('click', function() {
		var pro_panel = $('#process_datatable');
		pro_panel.block({
			message: '<i class="icon-spinner9 spinner"></i>',
			overlayCSS: {
				backgroundColor: '#fff',
				opacity: 0.8,
				cursor: 'wait'
			},
			css: {
				border: 0,
				padding: 0,
				backgroundColor: 'none'
			}
		});
		window.setTimeout(function() {
			pro_panel.unblock();
		}, 1000);

		// 刷新表格 数据
		if (SERVER == '') {
			getProgressData(false);
		} else {
			getServerProgressData();
		}

	});

})