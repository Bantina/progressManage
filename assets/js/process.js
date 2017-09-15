$(function() {

	//全局变量；
	var SERVER = '';
	var BUSINESS = '';
	var PRO_datatable;
	var URL_Port = 'http://10.99.1.155:81'

	// 初始化；
	init();

	function init() {
		getProgressData(true);
		getServerMenu();
	}
	// 悬挂菜单 数据获取
	function getServerMenu(){
		$.ajax({
			type: "get",
			url: URL_Port+"/Rpc/Supervisord/eachServer",
			dataType: 'json',
			success: function(res) {
				var serverHtml = '';
				var menuHtml = ''; // 悬挂菜单 html
				if (res.status == 1) {
					for(var i=0;i<res.data.length;i++){
						menuHtml += ['<div class="sidebar-category">', 
						'<div class="category-title">',
							'<span class="svName">'+ res.data[i].serverName+'</span>',
							'<ul class="icons-list">',
								'<li><a href="#" data-action="collapse" data-index="'+i+'"></a></li>',
							'</ul>',
						'</div>'].join('');
						if(res.data[i].business){
							
							menuHtml += '<div class="category-content no-padding"><ul class="navigation navigation-alt navigation-accordion">';
							for(var j=0;j<res.data[i].business.length;j++){
								menuHtml += '<li><a class="navigation_server_a" href="#"><i class="icon-server"></i>'+ res.data[i].business[j] +'</a></li>';

							}
							menuHtml += '</div></ul>'
						}
						menuHtml += '</div>';

						serverHtml += '<li><a href="javascript:void(0)">'+ res.data[i].serverName +'</a></li>';
					}
					$('.navigation_server').append(menuHtml);
					$('.sel_server_ul').append(serverHtml); // 添加进程 modal server select;
				}
			}
		})
	}

	// 悬挂菜单 隐藏与显示
	$('.navigation_server').on('click','.icons-list a[data-action]',function(){
		var index = $(this).attr('data-index');
		var categoryContent = $('.navigation_server .sidebar-category').eq(index).find('.category-content');
		var contentH = categoryContent.find('li').length * 44 + 'px';
		if($(this).hasClass('rotate-180')){
			$(this).removeClass('rotate-180');
			categoryContent.animate({height:contentH},200);
		}else{
			$(this).addClass('rotate-180');
			$('.navigation_server .sidebar-category').eq(index).find('.category-content').animate({height:0},200);
		}
	})


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
		var rows = []; // 数据数组
		for (var i = 0; i < programs.length; i++) {
			var row = {};
			row.svName = '<a class="td_pro_server">' + programs[i].svName + '</a>';
			row.busyName = '<a class="td_pro_business">' + programs[i].busyName + '</a>';
			row.proName = '<a class="td_pro_progress">' + programs[i].group + ':' + programs[i].name + '</a>';
			row.proDesc = programs[i].description;
			row.group = programs[i].group;
			if (programs[i].state == 20) { // running
				row.proState = '<span class="label label-success">' + programs[i].statename + '</span>';
			} else if (programs[i].state == 0) { // stopped
				row.proState = '<span class="label label-danger">' + programs[i].statename + '</span>';
			} else {
				row.proState = '<span class="label label-info">' + programs[i].statename + '</span>';
			}
			rows.push(row);
		};

		PRO_datatable = $('.datatable_progress').DataTable({ // dataTable
			data: rows,
			destroy: true,
			columns: [{
				data: 'group'
			},{
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
				targets: [5]
			}, {
				orderable: false,
				targets: [6],
				data: null,
				defaultContent: [
					'<a class="pro-action td_action_start" href="javascript:void(0);">启动</a>',
					'<a class="pro-action td_action_stop" href="javascript:void(0);">停止</a>',
					'<a class="pro-action td_action_restart" href="javascript:void(0);">重启</a>',
					'<a class="pro-action td_action_reload" href="javascript:void(0);">重载</a>',
					'<a class="pro-action td_action_delete" href="javascript:void(0);">删除</a>'
				].join('')
			}],
			drawCallback: function ( settings ) { // 分组显示
				var api = this.api();
				var rows = api.rows( {page:'current'} ).nodes();
				var last=null;

				api.column(0, {page:'current'} ).data().each( function ( group, i ) {
					if ( last !== group ) {
						$(rows).eq( i ).before(
							'<tr class="group" data-group-index="'+ i +'">'
								+'<td colspan="2">进程组：<span class="pro_group">'+group+'</span></td>'
								+'<td colspan="4">'
									+'<a class="pro-action-group td_action_groupEdit" href="javascript:void(0);"><i class="icon-pencil7"></i>组配置修改</a>'
									+'<a class="pro-action-group td_action_groupStop" href="javascript:void(0);"><i class="icon-spam"></i>组停止</a>'
									+'<a class="pro-action-group td_action_groupStart" href="javascript:void(0);"><i class="icon-switch"></i>组启动</a>'
								+'</td>'
							+'</tr>'
						);

						last = group;
					}
				} );
			}
		});

		PRO_datatable.column( 0 ).visible( false ); // 隐藏第一列；

	}

	/*
	 * 进程所有数据
	 */
	function getProgressData() {
		var data = [];
		$.ajax({
			type: "get",
			url: URL_Port+"/Rpc/Supervisord/index",
			dataType: 'json',
			success: function(json) {
				if (json.status == 1) {
					var serverHtml = '';
					var programs = [];
					for (var i in json.data) { 
						if(json.data[i].process){ // 某业务无进程的情况
							for (var j = 0; j < json.data[i].process.length; j++) { 
								var program = json.data[i].process[j];
								program.group = json.data[i].group;
								program.busyName = json.data[i].business;
								program.svName = json.data[i].serverName;
								programs.push(program);
							}
						}
					}
					progressDatatable(programs);

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
		if (SERVER == '' || BUSINESS == '') return; // 必须字段；
		$.ajax({
			type: "get",
			url: URL_Port+"/Rpc/Supervisord/serverInfo",
			data: {
				serverName: SERVER,
				business: BUSINESS
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					var programs = [];
					for (var i = 0; i < res.data.length; i++) { // 业务级
						if(res.data[i].process){ // 某业务无进程的情况
							for (var j = 0; j < res.data[i].process.length; j++) { // 进程级
								var program = res.data[i].process[j];
								program.group = res.data[i].group;
								program.busyName = res.data[i].business;
								program.svName = res.data[i].serverName;
								programs.push(program);
							}
						}
					}
					progressDatatable(programs);
				} else {
					alert(res.data);
					// 如果不存在，高亮全部；
				}
			}
		})
	}
	// 服务筛选：获取某一server下的的所有进程
	$('.navigation_server').on('click', '.navigation_server_a', function() {
		var _this = $(this);
		if(!_this.hasClass('active')){
			$('.navigation_server .navigation_server_all').removeClass('active');
			$('.navigation_server .navigation li .navigation_server_a').removeClass('active');
			_this.addClass('active');
		}
		SERVER = _this.parent().parent().parent().siblings('.category-title').find('.svName').text();
		BUSINESS = _this.text();
		getServerProgressData();
		$('.pro-nav-toggle').css({
			'display': 'none'
		});

	});

	// 获取 所有进程
	$('.navigation_server_all').on('click', function() {
		var _this = $(this);
		if(!_this.hasClass('active')){
			$('.navigation_server .navigation li .navigation_server_a').removeClass('active');
			_this.addClass('active');
		}
		getProgressData(false);
		SERVER = '';
		$('.pro-nav-toggle').css({ // 全部启动／停止
			'display': 'inline-block'
		});
	})


	// 表头点击事件；
	// 某一服务进程 全部启动 
	$('.pro_startAll').on('click', function() {
		if (SERVER == '') return;
		$.ajax({
			type: "post",
			url: URL_Port+"/Rpc/Programs/startAll",
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
			url: URL_Port+"/Rpc/Programs/stopAll",
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
			getProgressData();
		} else {
			getServerProgressData();
		}

	});
	
	// 添加进程
	$('.sel_server_ul').on('click','li',function(){ // modal select
		$('.sel_server_val').text($(this).text());
	})
	$('#addProgress').on('click', function() {
		var pro_server = $('.sel_server_val'),
			pro_business = $('.pro_business'),
			pro_worker = $('.pro_worker'),
			pro_order = $('.pro_order'),
			pro_user = $('.pro_user'),
			pro_num = $('.pro_num'),
			pro_name = $('.pro_name');
		var isPositiveInteger = /^[0-9]*[1-9][0-9]*$/, // 是否为正整数
			isInteger = /^[0-9]+.?[0-9]*$/; // 是否为数字

		if (pro_server.text() == '请选择服务器') {
			alert('您还没有选择服务器');
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
				url: URL_Port+"/Configure/Configure/doAddWorker",
				async: true,
				data: {
					serverName: pro_server.text(),
					business: pro_business.val(),
					workerName: pro_worker.val(),
					command: pro_order.val(),
					user: pro_user.val(),
					numprocs: pro_num.val(),
					process_name: pro_name.val()
				},
				dataType: 'json',
				success: function(res) {
					if (res.status == 1) {
						alert('添加成功');
						clearAddModal();
					} else if (res.status == 0) {
						alert(res.data);
					}

				}
			})
		}
	})
	
	function clearAddModal(){
		var pro_server = $('.sel_server_val'),
			pro_business = $('.pro_business'),
			pro_worker = $('.pro_worker'),
			pro_order = $('.pro_order'),
			pro_user = $('.pro_user'),
			pro_num = $('.pro_num'),
			pro_name = $('.pro_name');

			pro_server.text('请选择服务器');
			pro_business.val('');
			pro_worker.val('');
			pro_order.val('');
			pro_user.val('');
			pro_num.val('');
			pro_name.val('');
	}


	// 表格点击事件
	// 组操作
	// 组启动
	$('.datatable_progress').on('click', '.td_action_groupStart', function() {
		var group = $(this).parent().parent();
		var serverName = '';
		var workerName = group.find('.pro_group').text();
		var groupIndex = group.attr('data-group-index');
		var groupIndexNext = '';
		var table_rows = PRO_datatable.rows().data();
		for(var i =0;i<group.siblings().length;i++){
			if(group.siblings('.group').eq(i).attr('data-group-index')>groupIndex){
				groupIndexNext = group.siblings('.group').eq(i).attr('data-group-index');
				break;
			}else{
				groupIndexNext = table_rows.length;
			}
		}
		if(SERVER != ''){
			serverName = SERVER;
		}else{
			nexttr = group.next();
			if(nexttr.hasClass('group')){ //当前为空组的情况；
				return;
			}
			serverName = nexttr.children("td:first-child").children("a:first-child").text();
		}
		$.ajax({
			type: "post",
			url: URL_Port + "/Rpc/Programs/startProcessGroup",
			data: {
				serverName: serverName,
				workerName: workerName
			},
			dataType: 'json',
			success: function(res) {
				if (res.status == 1) {
					// var table_rows = PRO_datatable.rows().data();
					for (var i = Number(groupIndex); i < Number(groupIndexNext); i++) { // 状态修改
						table_rows[i].proState = '<span class="label label-success">running</span>';
					};
					PRO_datatable.rows().invalidate().draw(); // 表格重绘，必须加 invalidate();
				}
			}
		})
	})


	// 单进程操作
	// 获取某一服务详情
	$('.datatable_progress').on('click', '.td_pro_server', function() {
		var serverName = $(this).text();
		$.ajax({
			type: "post",
			url: URL_Port+"/Rpc/Supervisord/serverState",
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
			url: URL_Port+"/Rpc/Programs/startProcess",
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
			url: URL_Port+"/Rpc/Programs/stopProcess",
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
			url: URL_Port+"/Rpc/Programs/restartProcess",
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
			url: URL_Port+"/Rpc/Programs/reload",
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
			url: URL_Port+"/Configure/Configure/doDeleteWorker",
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

	

})