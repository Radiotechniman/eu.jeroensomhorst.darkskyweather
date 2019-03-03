'use strict';

const Homey = require('homey');
const DEFAULT_API_KEY = "abcdefghijklmnopqrstuvwxyz";


class DarkskyDevice extends Homey.Device{

    onInit(){
        Homey.app.log('Initialize device');
        this.triggers = new Map();
        this.conditions = new Map();
        let cstmCapabilities = Homey.manifest.capabilities;
        let driver = this.getDriver();


        this.getCapabilities().forEach((c)=>{

            if(cstmCapabilities.hasOwnProperty(c)){
                console.log("Adding capabilities and triggers for "+c);
                try {
                    let triggerName = c + "_trigger";
                    let conditionName = c + "_condition";

                    if(driver.triggerKeys.indexOf(triggerName) > -1){
                        this.triggers.set(c, new Homey.FlowCardTriggerDevice(triggerName).register());
                    }

                    if(driver.conditionKeys.indexOf(conditionName) > -1){
                        let condition = new Homey.FlowCardCondition(conditionName).register();
                        this.conditions.set(c,condition );
                        condition.registerRunListener((args,state)=>{
                            return this.onConditionTrigger(args, state,c);
                        });
                    }

                }catch(e){
                    console.error("Could not add trigger or condition");
                    console.error(e);
                }
            }

        });

        /*
        console.log("Add vis trigger");

        this.triggers.set("measure_visibility_capability",new Homey.FlowCardTriggerDevice('measure_visibility_capability_trigger').register());
        console.log("Add uvindex trigger");
        this.triggers.set("measure_uvindex_capability",new Homey.FlowCardTriggerDevice('measure_uvindex_capability_trigger').register());
        console.log("Add app temp trigger");
        this.triggers.set("measure_apparent_temperature_capability",new Homey.FlowCardTriggerDevice('measure_apparent_temperature_capability_trigger').register());
        console.log("Add high temp trigger");
        this.triggers.set("measure_temperature_high_capability",new Homey.FlowCardTriggerDevice('measure_temperature_high_capability_trigger').register());
        console.log("Add lowtemp trigger");
        this.triggers.set("measure_temperature_low_capability",new Homey.FlowCardTriggerDevice('measure_temperature_low_capability_trigger').register());
        console.log("Add cloudcover trigger");
        this.triggers.set("measure_cloudcover_capability",new Homey.FlowCardTriggerDevice('measure_cloudcover_capability_trigger').register());
        */



    }

    onConditionTrigger(args,state,name){
        console.log("Condition trigger for "+name);
        try{
            let currentvalue = this.getCapabilityValue(name);
            return Promise.resolve(currentvalue>=args.value);
        }catch(e){
            return Promise.reject('Unknown capability');
        }

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
        Homey.app.log("Set capability value");
        let previousValue = this.getCapabilityValue(capability);
        super.setCapabilityValue(capability,value);


        if(previousValue !== value) {
            Homey.app.log("Trigger the change");
            Homey.app.log(capability);
            if (this.triggers.has(capability)) {
                Homey.app.log("Found a trigger");
                let trigger = this.triggers.get(capability);

                trigger.trigger(this, {value: value})
                    .catch(this.error)
                    .then(this.log)

            } else {
                Homey.app.log("Could not find trigger for capability");
            }
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

module.exports = DarkskyDevice;