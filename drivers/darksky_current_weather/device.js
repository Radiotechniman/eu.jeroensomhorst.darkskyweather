'use strict';

const Homey = require('homey');
const DEFAULT_API_KEY = "abcdefghijklmnopqrstuvwxyz";


class DarkskyDevice extends Homey.Device{

    onInit(){
        Homey.app.log('Initialize device');
        this.triggers = new Map();

        this.triggers.set("measure_visibility_capability",new Homey.FlowCardTriggerDevice('measure_visibility_capability_changed').register());
        this.triggers.set("measure_uvindex_capability",new Homey.FlowCardTriggerDevice('measure_uvindex_capability_changed').register());
        this.triggers.set("measure_apparent_temperature_capability",new Homey.FlowCardTriggerDevice('measure_apparent_temperature_capability_changed').register());
        this.triggers.set("measure_temperature_high_capability",new Homey.FlowCardTriggerDevice('measure_temperature_high_capability_changed').register());
        this.triggers.set("measure_temperature_low_capability",new Homey.FlowCardTriggerDevice('measure_temperature_low_capability_changed').register());


    }
    async onSettings(oldSettingsObj, newSettingsObj, changedKeys){
        let driver = this.getDriver();
        let apiKey = newSettingsObj.apikey || "";
        let longtitude  = newSettingsObj.longtitude || 0;
        let latitude    = newSettingsObj.latitude || 0;

        if(changedKeys.indexOf('apikey') >= 0){
            apiKey = newSettingsObj.apikey;

            if(apiKey == null || apiKey.trim() === ""){
                throw new Error(Homey.__("settings_apikey_required"));
            }

            apiKey = newSettingsObj.apikey.trim();

        }
        if(changedKeys.indexOf("latitude")){
            if(!(newSettingsObj.latitude > -90 && newSettingsObj.latitude < 90)){
                throw new Error(Homey.__("settings_invalid_latitude"));
            }
        }

        if(changedKeys.indexOf("longtitude")) {
            if (!(newSettingsObj.longtitude > -180 && newSettingsObj.longtitude < 180)) {
                throw new Error(Homey.__("settings_invalid_longtitude"));
            }
        }


        let validKey = await driver.validateApiKey(apiKey,latitude, longtitude);

        if(!validKey){
            throw new Error(Homey.__("settings_apikey_invalid"));
        }
    }

    setCapabilityValue(capability,value){
        super.setCapabilityValue(capability,value);


        switch(capability){
            case 'measure_visibility_capability':
            case 'measure_uvindex_capability':
            case 'measure_apparent_temperature_capability':
            case 'measure_temperature_high_capability':
            case 'measure_temperature_low_capability':
                let previousValue = this.getCapabilityValue(capability);

                if(previousValue !== value) {
                    let trigger = this.triggers.get(capability);
                    if (trigger != null) {
                        trigger.trigger(this, {
                            value: value
                        }, {}).then(this.log).catch(this.error);
                    }
                }
                break;

        }

    }

    hasValidSettings(){
        let settings = this.getSettings();
        if((settings.hasOwnProperty('apikey') && settings.apikey !== DEFAULT_API_KEY && (settings.apikey!== "" || settings.apikey === null))
            && (settings.hasOwnProperty('latitude') && (settings.latitude!== 0 || settings.latitude === null))
            && (settings.hasOwnProperty('longtitude') && (settings.longtitude!== 0 || settings.longtitude === null) )){
            return true;
        }
        return false;
    }

    getApiKey(){
        let settings = this.getSettings();
        return settings.apikey;
    }

    getLatitude(){
        let settings = this.getSettings();
        return settings.latitude;
    }
    getLongtitude(){
        let settings = this.getSettings();
        return settings.longtitude;
    }

}

module.exports = DarkskyDevice