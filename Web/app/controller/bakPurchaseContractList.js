﻿var closeUpload = null;
$(function () {
    //初始化系统通用变量
    var toolBar, listGrid, editForm, dictDataList, sqlStr, serverDate, dhxLayout, divUploadLayout, uploadFile, documentToolBar, documentGrid,
        customerPop, customerQuickGrid, auditHistoryGrid,
      contract = null,
	  editItem = $("#editItem"),
	  pictureDataList = [],
	  documentDataList = new rock.JsonList(),
      dictDataList = new rock.JsonList(),
      auditHistoryDataList = new rock.JsonList();
    window.dhx_globalImgPath = "/resource/dhtmlx/codebase/imgs/";
    //加载动态脚本
    var jsTypes = "ISystemService,DataTable,DataRow,DataColumn,Contract,Customer,Material,IBusinessService";
    $.getScript('/LoadDomainJS.ashx?JsTypes=' + jsTypes, function () {
        //处理初始化加载数据

        sqlStr = "select top 100 [Contract].[ContractID], [Contract].[contractNum], [Customer].[CustomerName], convert(nvarchar(10),[Contract].[signDate],120) as signDate, [Material].[MaterialName], [Contract].[price], [Contract].[quantity], [Contract].[State], [Contract].[Causes] from [Contract] join [Customer] on [Contract].[customerID] = [Customer].[customerID] join [Material] on [Contract].[materialID] = [Material].[materialID] and [Contract].[ContractType] = '采购' and [Contract].[State] = '分管领导退回' and [Contract].[Agent] = '" + decodeURIComponent($.cookie('userTrueName')) + "'";
        ISystemService.execQuery.sqlString = sqlStr;
        rock.AjaxRequest(ISystemService.execQuery, rock.exceptionFun);
        if (ISystemService.execQuery.success) {
            (function (e) {
                rock.tableToListGrid(e, listGrid, dictDataList);
            }(ISystemService.execQuery.resultValue));
        }
        //初始化实体参照及查询项

        sqlStr = "SELECT [CustomerID],[CustomerName] FROM [Customer] where [Available] = '1' and [ForPurchase] = '1' order by CustomerName";
        ISystemService.execQuery.sqlString = sqlStr;
        rock.AjaxRequest(ISystemService.execQuery, rock.exceptionFun);
        if (ISystemService.execQuery.success) {
            (function (e) {
                if (e != null) {
                    var rows = e.rows;
                    var rowLength = rows.length;
                    for (var i = 0; i < rowLength; i++) {
                        var rowResult = rows[i].values;
                    }
                }
            }(ISystemService.execQuery.resultValue));
        }

        $("#combomaterial").empty();
        sqlStr = "SELECT [MaterialID],[MaterialName] FROM [Material] join [ProductMarketing] on [Material].[MaterialID] = [ProductMarketing].[ProductID] and [Material].[ForPurchase] = '1' and [Material].[Available] = '1' and [ProductMarketing].[PersonName] = '" + decodeURIComponent($.cookie('userTrueName')) + "'";
        ISystemService.execQuery.sqlString = sqlStr;
        rock.AjaxRequest(ISystemService.execQuery, rock.exceptionFun);
        if (ISystemService.execQuery.success) {
            (function (e) {
                if (e != null) {
                    var rows = e.rows;
                    var rowLength = rows.length;
                    for (var i = 0; i < rowLength; i++) {
                        var rowResult = rows[i].values;
                        $("#combomaterial").append("<option value='" + rowResult[0].value + "'>" + rowResult[1].value + "</option>")
                    }
                }
            }(ISystemService.execQuery.resultValue));
        }

        $("#combopayment").empty();
        sqlStr = "SELECT [ReferName] FROM [Refer] where [ReferType] = '付款方式'";
        ISystemService.execQuery.sqlString = sqlStr;
        rock.AjaxRequest(ISystemService.execQuery, rock.exceptionFun);
        if (ISystemService.execQuery.success) {
            (function (e) {
                if (e != null) {
                    var rows = e.rows;
                    var rowLength = rows.length;
                    for (var i = 0; i < rowLength; i++) {
                        var rowResult = rows[i].values;
                        $("#combopayment").append("<option value='" + rowResult[0].value + "'>" + rowResult[0].value + "</option>")
                    }
                }
            }(ISystemService.execQuery.resultValue));
        }

        $("#comboship").empty();
        sqlStr = "SELECT [ReferName] FROM [Refer] where [ReferType] = '发运方式'";
        ISystemService.execQuery.sqlString = sqlStr;
        rock.AjaxRequest(ISystemService.execQuery, rock.exceptionFun);
        if (ISystemService.execQuery.success) {
            (function (e) {
                if (e != null) {
                    var rows = e.rows;
                    var rowLength = rows.length;
                    for (var i = 0; i < rowLength; i++) {
                        var rowResult = rows[i].values;
                        $("#comboship").append("<option value='" + rowResult[0].value + "'>" + rowResult[0].value + "</option>")
                    }
                }
            }(ISystemService.execQuery.resultValue));
        }

        customerComplete("");

        //查询日期赋初值
        rock.AjaxRequest(ISystemService.getServerDate, rock.exceptionFun);
        if (ISystemService.getServerDate.success) {
            (function (e) {
                serverDate = e.value;
                var date = new Date(serverDate.replace('-', '/'));
                var beginDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-1';
                toolBar.setValue("begincreateDate", beginDate);
                toolBar.setValue("endcreateDate", serverDate);
            }(ISystemService.getServerDate.resultValue));
        }

        $("#txtquantity").blur(CalcJE);
        $("#txtprice").blur(CalcJE);
        //绑定控件失去焦点验证方法
        //ContractClass.validateBind();
        //初始化工具栏状态
        refreshToolBarState();

    });
    //界面布局
    dhxLayout = new dhtmlXLayoutObject("mainbody", "2E");
    dhxLayout.cells("a").hideHeader();
    dhxLayout.cells("a").attachObject("mainPage");
    dhxLayout.cells("b").setHeight(280);
    dhxLayout.cells("b").hideHeader();

    //上传文档布局页面
    divUploadLayout = new dhtmlXLayoutObject("divUpload", "1C");
    divUploadLayout.cells("a").hideHeader();

    tabbar = dhxLayout.cells("b").attachTabbar();
    tabbar.addTab("document", "附件", 80, 1);
    tabbar.addTab("history", "合同审批历史", 100, 2);

    tabbar.tabs("document").setActive();
    tabbar.tabs("document").attachObject("documentDiv");
    tabbar.tabs("history").attachObject("auditHistoryDiv");

    //初始化工具条同时处理查询条件
    toolBar = new dhtmlXToolbarObject("toolBar", 'dhx_skyblue');
    toolBar.setIconsPath("/resource/dhtmlx/codebase/imgs");
    toolBar.addText("customer", null, "客户");
    toolBar.addInput("txtcustomerSearch", null, "", 100);
    toolBar.addText("createDateBegin", null, "创建日期");
    toolBar.addInput("begincreateDate", null, "", 65);
    toolBar.addText("创建日期End", null, "-");
    toolBar.addInput("endcreateDate", null, "", 65);
    toolBar.addButton("query", null, "查询");
    toolBar.addSeparator("sepQuery", null);  
    toolBar.addButton("modify", null, "修改");
    toolBar.addSeparator("sepModify", null);
    toolBar.addButton("commit", null, "提交");
    toolBar.addSeparator("seprepeal", null);
    toolBar.addButton("repeal", null, "撤销");

    toolBar.attachEvent("onClick", function (id) {
        switch (id) {
            case "query":
                if ($.trim(toolBar.getValue("begincreateDate")) == "") {
                    alert("起始创建日期不能为空！");
                    return;
                }
                if (!rock.chkdate(toolBar.getValue("begincreateDate"), "-")) {
                    alert("起始创建日期格式不正确,正确格式为 2010-10-10！");
                    return false;
                }
                if ($.trim(toolBar.getValue("endcreateDate")) == "") {
                    alert("截止创建日期不能为空！");
                    return;
                }
                if (!rock.chkdate(toolBar.getValue("endcreateDate"), "-")) {
                    alert("截止创建日期格式不正确,正确格式为 2010-10-10！");
                    return false;
                }

                sqlStr = "select [Contract].[ContractID], [Contract].[contractNum], [Customer].[CustomerName], convert(nvarchar(10),[Contract].[signDate],120) as signDate, [Material].[MaterialName], [Contract].[price], [Contract].[quantity], [Contract].[State], [Contract].[Causes] from [Contract] join [Customer] on [Contract].[customerID] = [Customer].[customerID] join [Material] on [Contract].[materialID] = [Material].[materialID] and [Contract].[ContractType] = '采购' and [Contract].[State] = '分管领导退回' and [Contract].[Agent] = '" + decodeURIComponent($.cookie('userTrueName')) + "'";

                if (toolBar.getValue("txtcustomerSearch") != "") {
                    sqlStr += " and [Customer].[CustomerName] like '%" + toolBar.getValue("txtcustomerSearch") + "%'";
                }

                sqlStr += " and [Contract].[createDate] between '" + toolBar.getValue("begincreateDate") + " 0:0:0' AND '" + toolBar.getValue("endcreateDate") + " 23:59:59' ";

                ISystemService.execQuery.sqlString = sqlStr;
                rock.AjaxRequest(ISystemService.execQuery, rock.exceptionFun);
                if (ISystemService.execQuery.success) {
                    (function (e) {
                        rock.tableToListGrid(e, listGrid, dictDataList);
                        getUploadDocument();
                        refreshToolBarState();
                    }(ISystemService.execQuery.resultValue));
                }
                break;          
            case "modify":
                $("#formTitle").text("退回采购合同");
                var checked = listGrid.getCheckedRows(0);
                if (checked != "") {
                    if (checked.indexOf(',') == -1) {
                        var dictDataID = listGrid.cells(checked, 1).getValue();
                        ISystemService.getDynObjectByID.dynObjectID = dictDataID;
                        ISystemService.getDynObjectByID.structName = "Contract";
                        rock.AjaxRequest(ISystemService.getDynObjectByID, rock.exceptionFun);
                        if (ISystemService.getDynObjectByID.success) {
                            (function (e) {
                                contract = e;
                            }(ISystemService.getDynObjectByID.resultValue));
                        }
                        else {
                            return;
                        }

                        $("#txtcontractNum").val(contract.contractNum);
                        rock.setSelectItem("combopayment", contract.payment, "text");
                        rock.setSelectItem("comboship", contract.ship, "text");
                        $("#txtcreateDate").val(contract.createDate.split(' ')[0]);
                        $("#txteffectiveDate").val(contract.effectiveDate.split(' ')[0]);
                        $("#txtcustomerID").val(contract.customerID);
                        ISystemService.executeScalar.sqlString = "select [CustomerName] from [Customer] where [CustomerID] = " + contract.customerID;
                        rock.AjaxRequest(ISystemService.executeScalar, rock.exceptionFun);
                        var warehouseName = null;
                        if (ISystemService.executeScalar.success) {
                            (function (e) {
                                $("#txtcustomer").val(e.value);
                            }(ISystemService.executeScalar.resultValue));
                        }
                        rock.setSelectItem("combomaterial", contract.materialID, "value");
                        $("#txtmaterialGrade").val(contract.materialGrade);
                        $("#txtnumber").val(contract.number);
                        $("#txtquantity").val(contract.quantity);
                        $("#txtprice").val(contract.price);
                        $("#txttotal").val(contract.total);
                        $("#txtmeasure").val(contract.measure);
                        $("#txtagent").val(contract.agent);
                        $("#txtcauses").val(contract.causes);
                        showEditForm();
                    }
                    else {
                        alert("请仅选择一条要修改的行!");
                    }
                }
                else {
                    alert("请选择要修改的行!");
                }
                break;            
            case "commit":
                var checked = listGrid.getCheckedRows(0);
                if (checked != "") {
                    if (checked.indexOf(',') == -1) {
                        ISystemService.getDynObjectByID.dynObjectID = checked;
                        ISystemService.getDynObjectByID.structName = "Contract";
                        rock.AjaxRequest(ISystemService.getDynObjectByID, rock.exceptionFun);
                        if (ISystemService.getDynObjectByID.success) {
                            (function (e) {
                                contract = e;
                            }(ISystemService.getDynObjectByID.resultValue));
                        }
                        else {
                            return;
                        }

                        if (contract.state == "已创建") {
                            if (!contract.closed) {
                                contract.state = "已提交";
                                contract.commitDate = serverDate;

                                ISystemService.modifyDynObject.dynObject = contract;
                                rock.AjaxRequest(ISystemService.modifyDynObject, rock.exceptionFun);
                                if (ISystemService.modifyDynObject.success) {
                                    (function (e) {
                                        for (var i = 0; i < dictDataList.rows.length; i++) {
                                            if (dictDataList.rows[i].id == contract.contractID) {

                                                dictDataList.rows[i].data[8] = "已提交";
                                            }
                                        }
                                    }(ISystemService.modifyDynObject.resultValue));
                                    listGrid.clearAll();
                                    listGrid.parse(dictDataList, "json");
                                    refreshToolBarState();
                                }
                            }
                            else {
                                alert("合同已经关闭无法提交!");
                                return;
                            }
                        }
                        else {
                            alert("合同状态不正确无法提交,请联系管理员处理!");
                            return;
                        }
                    }
                    else {
                        alert("请仅选择一条要提交的行!");
                    }
                }
                else {
                    alert("请选择要提交的行!");
                }
                break;
            case "repeal":
                var checked = listGrid.getCheckedRows(0);
                if (checked != "") {
                    if (checked.indexOf(',') == -1) {
                        ISystemService.getDynObjectByID.dynObjectID = checked;
                        ISystemService.getDynObjectByID.structName = "Contract";
                        rock.AjaxRequest(ISystemService.getDynObjectByID, rock.exceptionFun);
                        if (ISystemService.getDynObjectByID.success) {
                            (function (e) {
                                contract = e;
                            }(ISystemService.getDynObjectByID.resultValue));
                        }
                        else {
                            return;
                        }

                        if (contract.state == "已提交") {
                            if (!contract.closed) {
                                contract.state = "已创建";
                                contract.commitDate = serverDate;

                                ISystemService.modifyDynObject.dynObject = contract;
                                rock.AjaxRequest(ISystemService.modifyDynObject, rock.exceptionFun);
                                if (ISystemService.modifyDynObject.success) {
                                    (function (e) {
                                        for (var i = 0; i < dictDataList.rows.length; i++) {
                                            if (dictDataList.rows[i].id == contract.contractID) {

                                                dictDataList.rows[i].data[8] = "已创建";
                                            }
                                        }
                                    }(ISystemService.modifyDynObject.resultValue));
                                    listGrid.clearAll();
                                    listGrid.parse(dictDataList, "json");
                                    refreshToolBarState();
                                }
                            }
                            else {
                                alert("合同已经关闭无法撤销!");
                                return;
                            }
                        }
                        else {
                            alert("合同状态不正确无法撤销,请联系管理员处理!");
                            return;
                        }
                    }
                    else {
                        alert("请仅选择一条要撤销的行!");
                    }
                }
                else {
                    alert("请选择要撤销的行!");
                }
                break;
        }
    });



    //初始化采购合同列表
    listGrid = new dhtmlXGridObject("listGrid");
    listGrid.setImagePath("/resource/dhtmlx/codebase/imgs/");
    listGrid.setSkin("dhx_skyblue");
    listGrid.setHeader("选择,,合同编号,客户名称,签定日期,产品名称,产品单价,合同数量,状态,合同事由");
    listGrid.setInitWidths("40,0,80,150,80,100,80,80,60,*");
    listGrid.setColAlign("center,left,left,left,left,left,left,left,left,left");
    listGrid.setColSorting("na,na,str,str,str,str,str,str,str,str");
    listGrid.setColTypes("ch,ro,ro,ro,ro,ro,ro,ro,ro,ro");
    listGrid.enableDistributedParsing(true, 20);
    listGrid.attachEvent("onRowDblClicked", function (rowID, cIndex) {
        $("#formTitle").text("退回采购合同");
        ISystemService.getDynObjectByID.dynObjectID = rowID;
        ISystemService.getDynObjectByID.structName = "Contract";
        rock.AjaxRequest(ISystemService.getDynObjectByID, rock.exceptionFun);
        if (ISystemService.getDynObjectByID.success) {
            (function (e) {
                contract = e;
            }(ISystemService.getDynObjectByID.resultValue));
        }
        else {
            return;
        }

        $("#txtcontractNum").val(contract.contractNum);
        rock.setSelectItem("combopayment", contract.payment, "text");
        rock.setSelectItem("comboship", contract.ship, "text");
        $("#txtcreateDate").val(contract.createDate.split(' ')[0]);
        $("#txteffectiveDate").val(contract.effectiveDate.split(' ')[0]);
        $("#txtcustomerID").val(contract.customerID);
        ISystemService.executeScalar.sqlString = "select [CustomerName] from [Customer] where [CustomerID] = " + contract.customerID;
        rock.AjaxRequest(ISystemService.executeScalar, rock.exceptionFun);
        var warehouseName = null;
        if (ISystemService.executeScalar.success) {
            (function (e) {
                $("#txtcustomer").val(e.value);
            }(ISystemService.executeScalar.resultValue));
        }

        rock.setSelectItem("combomaterial", contract.materialID, "value");
        $("#txtmaterialGrade").val(contract.materialGrade);
        $("#txtnumber").val(contract.number);
        $("#txtquantity").val(contract.quantity);
        $("#txtprice").val(contract.price);
        $("#txttotal").val(contract.total);
        $("#txtmeasure").val(contract.measure);
        $("#txtagent").val(contract.agent);
        $("#txtcauses").val(contract.causes);
        showEditForm();
    });
    listGrid.attachEvent("onCheck", function (rowID, cIndex) {
        refreshToolBarState();
        refreshDocumentToolBarState();
        return true;
    });
    listGrid.attachEvent("onRowSelect", function (rowID, cIndex) {
        getUploadDocument(rowID);
        getauditHistoryList(rowID);
        return true;
    });
    listGrid.init();

    //初始化上传文档工具栏
    documentToolBar = new dhtmlXToolbarObject("documentToolBar");
    documentToolBar.setIconsPath("/resource/dhtmlx/codebase/imgs/own/");
    documentToolBar.setSkin("dhx_skyblue");
    documentToolBar.addButton("upload", 2, "上传", "add.png", "addDisabled.png");
    documentToolBar.addSeparator("001", 1);
    documentToolBar.addButton("delete", 3, "删除", "delete.png", "deleteDisabled.png");
    documentToolBar.attachEvent("onClick", function (id) {
        switch (id) {
            case "upload":
                var objectID = listGrid.getCheckedRows(0);
                divUploadLayout.cells("a").attachURL("../view/UploadFile.html?objectID=" + objectID + "&objectType=采购合同");
                showUploadFile();
                break;
            case "delete":
                var checked = documentGrid.getCheckedRows(0);
                if (confirm("您确定要删除选定的记录吗?")) {
                    var rowids = checked.split(',');
                    var userRoleRelateExist = false;
                    for (var i = 0; i < rowids.length; i++) {
                        ISystemService.deleteUploadFile.uploadFileID = rowids[i];
                        rock.AjaxRequest(ISystemService.deleteUploadFile, rock.exceptionFun);
                        if (ISystemService.deleteUploadFile.success) {
                            (function (e) {
                                for (var j = 0; j < documentDataList.rows.length; j++) {
                                    if (documentDataList.rows[j].id == rowids[i]) {
                                        documentDataList.rows.splice(j, 1);
                                        documentGrid.deleteRow(rowids[i]);
                                        break;
                                    }
                                }
                            }(ISystemService.deleteUploadFile.resultValue));
                        }
                    }
                    refreshDocumentToolBarState();
                }
                break;
        }
    });

    documentGrid = new dhtmlXGridObject("documentGrid");
    documentGrid.setImagePath("/resource/dhtmlx/codebase/imgs/");
    documentGrid.setSkin("dhx_skyblue");
    documentGrid.setHeader("选择,,文档名称,文档类型,上传时间,文档格式,上传人,");
    documentGrid.setInitWidths("45,0,*,100,120,100,80,0");
    documentGrid.setColAlign("center,left,left,left,left,left,left,left");
    documentGrid.setColTypes("ch,ro,ro,ro,ro,ro,ro,ro");
    documentGrid.setColSorting("na,na,str,str,str,str,str,na");
    documentGrid.enableDistributedParsing(true, 20);
    documentGrid.attachEvent("onRowDblClicked", function (rowID, cIndex) {
        window.open("\\Upload\\" + documentGrid.cells(rowID, 7).getValue());
        //if (documentGrid.cells(rowID, 5).getValue() == '.txt') {
        //    var winname = window.open("\\Upload\\" + documentGrid.cells(rowID, 7).getValue());
        //    winname.document.execCommand('Saveas', false, "\\Upload\\" + documentGrid.cells(rowID, 7).getValue());
        //    winname.close();
        //} else {
        //    window.location.href = "\\Upload\\" + documentGrid.cells(rowID, 7).getValue();
        //}
    });
    //单击选中取消
    documentGrid.attachEvent("onCheck", function (rowID, cIndex) {
        refreshDocumentToolBarState();
        return true;
    });
    documentGrid.init();

    refreshDocumentToolBarState();

    //初始化流程处理信息列表
    auditHistoryGrid = new dhtmlXGridObject("auditHistoryGrid");
    auditHistoryGrid.setImagePath("/resource/dhtmlx/codebase/imgs/");
    auditHistoryGrid.setSkin("dhx_skyblue");
    auditHistoryGrid.setHeader("序号,,审批部门,审批意见,审批人,审批结果,审批时间");
    auditHistoryGrid.setInitWidths("40,0,100,100,100,100,*");
    auditHistoryGrid.setColAlign("center,left,left,left,left,left,left");
    auditHistoryGrid.setColSorting("na,na,str,str,str,str,str");
    auditHistoryGrid.setColTypes("cntr,ro,ro,ro,ro,ro,ro");
    auditHistoryGrid.enableDistributedParsing(true, 20);
    auditHistoryGrid.init();

    //加载流程处理信息数据
    function getauditHistoryList(rowID) {
        if (rowID) {
            ISystemService.execQuery.sqlString = "select [WorkflowActivityInstanceID], [Comment],[Opinion],[Handler],[Result],[EndTime] from [WorkflowActivityInstance] where [ObjType] = 'Contract' and [ObjID] = " + rowID;
            rock.AjaxRequest(ISystemService.execQuery, rock.exceptionFun);
            if (ISystemService.execQuery.success) {
                (function (e) {
                    rock.tableToListGrid(e, auditHistoryGrid, auditHistoryDataList)
                }(ISystemService.execQuery.resultValue));
            }
        }
        else {
            auditHistoryGrid.clearAll();
        }
    }

    //初始化编辑弹窗
    editForm = $("#editForm");

    editForm.height(450);
    editForm.width(720);
    editForm.mousedown(function (e) {
        iDiffX = e.pageX - $(this).offset().left;
        iDiffY = e.pageY - $(this).offset().top;

        if (iDiffY < 30) {
            $(document).mousemove(function (e) {
                editForm.css({ "left": (e.pageX - iDiffX), "top": (e.pageY - iDiffY) });
            });
        }
    });
    editForm.mouseup(function () {
        $(document).unbind("mousemove");
    });
    hideEditForm();
    function hideEditForm() {
        editForm.css({ top: 200, left: -1300 }).hide();
        editForm.css("visibility", "visible");
    }
    function showEditForm() {
        editForm.css({ top: 80, left: 180 }).show();
    }
    //取消
    $("#btn_Cancle").click(function () {
        hideEditForm();
    });
    //关闭
    $("#img_Close").click(function () {
        hideEditForm();
    });  


    //保存
    $("#btn_Save").click(function () {
        //if (!$("#txtcontractNum").validate("required", "合同编号")) {
        //    return false;
        //}

        if (!$("#txtcustomer").validate("required", "客户")) {
            return false;
        }

        if (!$("#txtcustomerID").validate("required", "客户")) {
            return false;
        }

        if (!$("#txtquantity").validate("number", "合同数量")) {
            return false;
        }

        if ($("#txtprice").val() == '') {
            $("#txtprice").focus();
            alert('货品单价不允许为空！');
            return false;
        }
        if (!rock.chknum($("#txtprice").val())) {
            alert('货品单价输入格式错误');
            $("#txtprice").focus();
            return false;
        }

        if (!rock.chknum($("#txttotal").val())) {
            alert('货款合计输入格式错误');
            $("#txttotal").focus();
            return false;
        }

        if (!$("#txteffectiveDate").validate("required", "有效日期")) {
            return false;
        }
        if (!$("#txteffectiveDate").validate("date", "有效日期")) {
            return false;
        }

        if (!$("#txtagent").validate("required", "经办人")) {
            return false;
        }

        if (!$("#txtcreateDate").validate("required", "创建日期")) {
            return false;
        }
        if (!$("#txtcreateDate").validate("date", "创建日期")) {
            return false;
        }

        var customerQualified = "";

        IBusinessService.customerQualified.customerID = $("#txtcustomerID").val();
        rock.AjaxRequest(IBusinessService.customerQualified, rock.exceptionFun);
        if (IBusinessService.customerQualified.success) {
            (function (e) {
                customerQualified = e.value;
            }(IBusinessService.customerQualified.resultValue))
        }

        if (customerQualified != "") {
            alert("当前客户的资质不具备条件,请检查!");
            alert(customerQualified);
            return;
        }

        contract.contractType = "采购"
        contract.state = "已创建"
        contract.closed = false;
        contract.otherDepart = false;
        contract.signNum = 2;
        contract.signedNum = 0;
        contract.back = false;
        contract.contractNum = $("#txtcontractNum").val();
        //if ($.trim($("#txtpriceType").val()) != '') {
        //    contract.priceType = $("#txtpriceType").val();
        //}
        //else {
        //    contract.priceType = null;
        //}


        if ($.trim($("#combopayment").val()) != '') {
            contract.payment = $("#combopayment").val();
        }
        else {
            contract.payment = null;
        }

        if ($.trim($("#comboship").val()) != '') {
            contract.ship = $("#comboship").val();
        }
        else {
            contract.ship = null;
        }

        contract.createDate = $("#txtcreateDate").val();

        contract.effectiveDate = $("#txteffectiveDate").val();

        contract.customerID = $("#txtcustomerID").val();

        contract.materialID = $("#combomaterial").val();

        if ($.trim($("#txtmaterialGrade").val()) != '') {
            contract.materialGrade = $("#txtmaterialGrade").val();
        }
        else {
            contract.materialGrade = null;
        }


        if ($.trim($("#txtnumber").val()) != '') {
            contract.number = $("#txtnumber").val();
        }
        else {
            contract.number = null;
        }

        contract.quantity = $("#txtquantity").val();


        if ($.trim($("#txtprice").val()) != '') {
            contract.price = $("#txtprice").val();
        }
        else {
            contract.price = null;
        }

        if ($.trim($("#txttotal").val()) != '') {
            contract.total = $("#txttotal").val();
        }
        else {
            contract.total = null;
        }


        if ($.trim($("#txtmeasure").val()) != '') {
            contract.measure = $("#txtmeasure").val();
        }
        else {
            contract.measure = null;
        }


        if ($.trim($("#txtagent").val()) != '') {
            contract.agent = $("#txtagent").val();
        }
        else {
            contract.agent = null;
        }


        if ($.trim($("#txtcauses").val()) != '') {
            contract.causes = $("#txtcauses").val();
        }
        else {
            contract.causes = null;
        }

        ISystemService.modifyDynObject.dynObject = contract;
        rock.AjaxRequest(ISystemService.modifyDynObject, rock.exceptionFun);
        if (ISystemService.modifyDynObject.success) {
            (function (e) {
                for (var i = 0; i < dictDataList.rows.length; i++) {
                    if (dictDataList.rows[i].id == contract.contractID) {
                        dictDataList.rows[i].data[0] = 0;

                        dictDataList.rows[i].data[2] = $("#txtcontractNum").val();

                        dictDataList.rows[i].data[3] = $("#txtcustomer").val();

                        dictDataList.rows[i].data[4] = $("#txtsignDate").val();

                        dictDataList.rows[i].data[5] = $("#combomaterial").find("option:selected").text();

                        dictDataList.rows[i].data[6] = $("#txtprice").val();

                        dictDataList.rows[i].data[7] = $("#txtquantity").val();
                        dictDataList.rows[i].data[8] = contract.state;
                        dictDataList.rows[i].data[9] = contract.causes;
                    }
                }
            }(ISystemService.modifyDynObject.resultValue));
            listGrid.clearAll();
            listGrid.parse(dictDataList, "json");
            hideEditForm();
            alert("采购合同修改成功!");
        }                
        refreshToolBarState();
    });

    //加载弹窗Div

    //$(document.body).append('');

    customerQuickGrid = new dhtmlXGridObject("customerQuickGrid");
    customerQuickGrid.setImagePath("/resource/dhtmlx/codebase/imgs/");
    customerQuickGrid.setSkin("dhx_skyblue");
    customerQuickGrid.setHeader(",,");
    customerQuickGrid.setInitWidths("0,0,*");
    customerQuickGrid.setColAlign("center,center,left");
    customerQuickGrid.setColSorting("na,na,str");
    customerQuickGrid.setColTypes("ro,ro,ro");
    customerQuickGrid.enableDistributedParsing(true, 20);
    customerQuickGrid.attachEvent("onRowDblClicked", function (rowID, cIndex) {
        $("#txtcustomerID").val(rowID)
        $("#txtcustomer").val(customerQuickGrid.cells(rowID, 2).getValue())
        hidecustomerPop();
    });
    customerQuickGrid.init();
    customerQuickGrid.detachHeader(0);
    customerPop = $("#customerPop")
    $('#txtcustomer').focus(function (e) {
        showcustomerPop();
    });

    function showcustomerPop() {
        var top = $("#txtcustomer").offset().top;
        var left = $("#txtcustomer").offset().left;
        customerPop.css({ top: top + 22, left: left }).show();
    }

    function hidecustomerPop() {
        customerPop.css({ top: 200, left: -1300 }).hide();
    }
    hidecustomerPop();

    $("#txtcustomer").keyup(function () {
        customerComplete($("#txtcustomer").val());
    });
    var customerDataList = new rock.JsonList();
    function customerComplete(searchCode) {
        ISystemService.execQuery.sqlString = "select top 14 [Customer].[CustomerID], [Customer].[CustomerName] from [Customer] where [CustomerName] like  '%" + $("#txtcustomer").val() + "%' or [SearchCode] like  '%" + $("#txtcustomer").val() + "%'";
        rock.AjaxRequest(ISystemService.execQuery, rock.exceptionFun);
        if (ISystemService.execQuery.success) {
            (function (e) {
                rock.tableToListGrid(e, customerQuickGrid, customerDataList);
            }(ISystemService.execQuery.resultValue));
        }
    }


    $('#editForm').mousedown(function (e) {

        if (e.srcElement.id != "txtcustomer") {
            hidecustomerPop();
        }
    });


    //文档上传
    uploadFile = $("#uploadFile");
    uploadFile.mousedown(function (e) {
        iDiffX = e.pageX - $(this).offset().left;
        iDiffY = e.pageY - $(this).offset().top;
        if (iDiffY < 30) {
            $(document).mousemove(function (e) {
                uploadFile.css({ "left": (e.pageX - iDiffX), "top": (e.pageY - iDiffY) });
            });
        }
    });
    uploadFile.mouseup(function () {
        $(document).unbind("mousemove");
    });
    hideUploadFile();
    function hideUploadFile() {
        uploadFile.hide();
        uploadFile.css("visibility", "visible");

    }
    function showUploadFile() {
        uploadFile.css({ top: 20, left: 30 }).show();
    }

    //文档上传界面关闭按钮
    $("#uploadFile_Close").click(function () {
        getUploadDocument(listGrid.getCheckedRows(0));
        hideUploadFile();
    });

    function getUploadDocument(rowID) {
        documentGrid.clearAll();
        documentDataList.rows = [];
        if (rowID) {
            sqlStr = "SELECT [UploadFileID],[LocalFileName],[FileType],[UploadTime],[FileFormat],[Uploader],[ServerFileName] FROM [UploadFile] where [FileType] = '文档' and [ObjectID] = " + rowID + "  order by UploadTime desc";
            ISystemService.execQuery.sqlString = sqlStr;
            rock.AjaxRequest(ISystemService.execQuery, rock.exceptionFun);
            if (ISystemService.execQuery.success) {
                (function (e) {
                    if (e != null) {
                        var rows = e.rows;
                        var colLength = e.columns.length;
                        var rowLength = rows.length;
                        for (var i = 0; i < rowLength; i++) {
                            var rowResult = rows[i].values;
                            var listdata = new rock.JsonData(rowResult[0].value);
                            listdata.data[0] = 0;
                            for (var j = 0; j < colLength; j++) {
                                listdata.data[j + 1] = rowResult[j].value;
                            }
                            documentDataList.rows.push(listdata);
                        }
                        documentGrid.parse(documentDataList, "json");
                    }
                }(ISystemService.execQuery.resultValue));
            }
        }
    }

    closeUpload = function () {
        hideUploadFile();
        if (tabbar.getActiveTab() == "picture") {
            getUploadPicture(listGrid.getCheckedRows(0));
        }
        else if (tabbar.getActiveTab() == "document") {
            getUploadDocument(listGrid.getCheckedRows(0));
        }
    }
    //文档上传界面关闭按钮
    $("#uploadFile_Close").click(closeUpload);
    //工具栏按钮状态控制
    function refreshToolBarState() {
        var checked = listGrid.getCheckedRows(0);
        var rowids = checked.split(',');
        if (checked == "") {
            toolBar.disableItem("modify");
            toolBar.disableItem("commit");
            toolBar.disableItem("repeal");

        }
        else {
            if (rowids.length != 1) {
                toolBar.disableItem("modify");
                toolBar.disableItem("commit");
                toolBar.disableItem("repeal");

            }
            else {
                var state = listGrid.cells(checked, 8).getValue();
                switch (state) {
                    case "已创建":
                        toolBar.enableItem("modify");
                        toolBar.enableItem("commit");
                        toolBar.disableItem("repeal");
                        break;
                    case "分管领导退回":
                        toolBar.enableItem("modify");
                        toolBar.disableItem("commit");
                        toolBar.disableItem("repeal");
                        break;
                    case "已提交":
                        toolBar.disableItem("modify");
                        toolBar.disableItem("commit");
                        toolBar.enableItem("repeal");
                        break;
                    default:
                        toolBar.disableItem("modify");
                        toolBar.disableItem("commit");
                        toolBar.disableItem("repeal");
                       
                }
            }
        }
    }
    //文档上传按钮状态控制
    function refreshDocumentToolBarState() {
        var checked = listGrid.getCheckedRows(0);
        var state = null;
        var rowids = checked.split(',');
        if (checked == "") {
            documentToolBar.disableItem("upload");
            documentToolBar.disableItem("delete");
        }
        else {
            if (rowids.length == 1) {
                state = listGrid.cells(checked, 8).getValue();
                if (state == "已创建") {
                    documentToolBar.enableItem("upload");
                    //判断附件是否选中
                    var docchecked = documentGrid.getCheckedRows(0);
                    if (docchecked == "") {
                        documentToolBar.disableItem("delete");
                    }
                    else {
                        documentToolBar.enableItem("delete");
                    }
                }
                else {
                    documentToolBar.disableItem("upload");
                }
            }
            else {
                documentToolBar.disableItem("upload");
                documentToolBar.disableItem("delete");
            }
        }
    }

    function CalcJE() {
        var txt合同数量 = $("#txtquantity").val();
        var txt货品单价 = $("#txtprice").val();
        var txt货款合计 = $("#txttotal").val();
        var 货品单价 = 0;
        var 单价 = 0;
        var 数量 = 0;
        var 金额 = 0;

        if (txt合同数量 != "") {

            if (rock.chknum(txt合同数量)) {
                数量 = parseFloat(txt合同数量);
            }
        }
        if (txt货品单价.value != "") {
            if (rock.chknum(txt货品单价)) {
                单价 = parseFloat(txt货品单价);
            }
        }

        金额 = 单价 * 数量;
        txt货款合计 = Number(金额).toFixed(2).toString();
        $("#txttotal").val(txt货款合计)
    }

    //日期控件处理 
    var dateboxArray = [];

    dateboxArray.push(toolBar.getInput("begincreateDate"));

    dateboxArray.push(toolBar.getInput("endcreateDate"));

    dateboxArray.push("txtcreateDate");

    dateboxArray.push("txteffectiveDate");

    myCalendar = new dhtmlXCalendarObject(dateboxArray);
    myCalendar.loadUserLanguage('cn');

})