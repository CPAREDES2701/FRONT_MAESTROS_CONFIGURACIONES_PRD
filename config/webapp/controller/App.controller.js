sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	const HOST = "https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com";
    // const USER_HOST = "https://current-user-qas.cfapps.us10.hana.ondemand.com";
    const USER_HOST ="https://nodeapp-api-qas.cfapps.us10.hana.ondemand.com/";
	
	return BaseController.extend("com.tasa.config.controller.App", {

		onInit : function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy : true,
				delay : 0,
				layout : "OneColumn",
				previousLayout : "",
				actionButtonsInfo : {
					midColumn : {
						fullScreen : false
					}
				}
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// since then() has no "reject"-path attach to the MetadataFailed-Event to disable the busy indicator in case of an error
			this.getOwnerComponent().getModel().dataLoaded().then(fnSetAppNotBusy);
			// this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
            this.Count = 0; 
            this.CountService = 1;
			this._getListaMaestros(oViewModel);
            // this._getCurrentUser(oViewModel);
		},

		_getListaMaestros: async function(oViewModel,sEmail){
            let oModel = this.getModel(),
            iOriginalBusyDelay = this.getView().getBusyIndicatorDelay(),
            sUrl = HOST+"/api/General/AppMaestros/",
            oParams = {
                p_app: "",
                // p_rol: sEmail,
                p_rol: "CTIRADO@XTERNAL.BIZ",
				p_tipo: "CONFIGURACIONES"
            },
            oDataMaestros = await this.getDataService(sUrl,oParams);
            
            if(oDataMaestros){
                let aApps = oDataMaestros.t_tabapp,
                aFields = oDataMaestros.t_tabfield,
                aServices = oDataMaestros.t_tabservice,
                aFieldsApp,
                aServicesApp,
                aSearchingHelpApp,
                oSearchHelp,
                oSearchHelpExist,
                aSearchingHelp=aServices.filter(oServ=>oServ.MODEL==="AYUDABUSQUEDA");
                aApps.forEach(oApp=>{
                    aSearchingHelpApp=[];
                    aServicesApp=[];
                    aFieldsApp=[];
                    aFieldsApp=aFields.filter(oField=>oApp.IDAPP===oField.IDAPP);
                    aServicesApp=aServices.filter(oService=>oApp.IDAPP===oService.IDAPP);
                    oApp.fields=aFieldsApp;
                    oApp.services=aServicesApp;
                    oApp.searchHelp=aSearchingHelpApp;
                    aFieldsApp.forEach(oField=>{
                        oSearchHelp=aSearchingHelp.find(oServ=>oServ.IDAPP===oField.COMPONENT);
                        if(oSearchHelp){
                            oSearchHelpExist = aSearchingHelpApp.find(serv=>serv.IDAPP===oSearchHelp.IDAPP);
                            if(!oSearchHelpExist)
                                aSearchingHelpApp.push(oSearchHelp)
                        }
                    })
                    oApp.icon="sap-icon://busy"; 
                });
                oModel.setProperty("/listaConfig",aApps);
                oModel.setProperty("/helpFieldList",aFields);
            }else{
                this.getMessageDialog("Information", `No se econtraron registros`);    
            }
            oViewModel.setProperty("/busy",false);
            oViewModel.setProperty("/delay",iOriginalBusyDelay);
        },

        _getCurrentUser: async function(oViewModel){
            let oUserInfo = await sap.ushell.Container.getServiceAsync("UserInfo");
            if(oUserInfo){
                let sEmail = oUserInfo.getEmail().toUpperCase();
                this._getListaMaestros(oViewModel,sEmail);
            }
        }

	});
});