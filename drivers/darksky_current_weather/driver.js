'use strict';

const Homey = require('homey');
const format = require('string-format')
const https = require("https");
const HOUR_MILLISECONDS = 3600;
const API_URL = "https://api.darksky.net/forecast/{0}/{1},{2}/?flags&units=si";



const CRONTASK_RETRIEVEWEATHERINFO = "eu.jeroensomhorst.darkskyweather.cron";

class DarkskyDriver extends Homey.Driver{

    async onInit() {
        Homey.ManagerCron.getTask(CRONTASK_RETRIEVEWEATHERINFO)
            .then(task => {
                this.log("The task exists: " + CRONTASK_RETRIEVEWEATHERINFO);
                task.on('run', () => this.onCronRun());
            })
            .catch(err => {
                if (err.code === 404) {
                    this.log("The task has not been registered yet, registering task: " + CRONTASK_RETRIEVEWEATHERINFO);
                    Homey.ManagerCron.registerTask(CRONTASK_RETRIEVEWEATHERINFO, "1 */2 * * * *", {})
                        .then(task => {
                            task.on('run', () => this.onCronRun());
                        })
                        .catch(err => {
                            this.log(`problem with registering cronjob: ${err.message}`);
                        });
                } else {
                    this.log(`other cron error: ${err.message}`);
                }
            });

        this.retrievedDaily = -1;

        this.triggerKeys = [];
        this.conditionKeys = [];
        if(Homey.manifest.hasOwnProperty('flow')){
            if(Homey.manifest.flow.hasOwnProperty('triggers')) {
                Homey.manifest.flow.triggers.forEach((element) => {
                    this.triggerKeys.push(element.id);
                });
            }

            if(Homey.manifest.flow.hasOwnProperty('conditions')) {
                Homey.manifest.flow.conditions.forEach((element) => {
                    this.conditionKeys.push(element.id);
                });
            }
        }
    }

    async onCronRun(){
        this.log("cron run!");

        this.getDevices().forEach((device)=>{
            this.handleDevice(device);
        });
    }

    async handleDevice(device){
        if (!device.hasValidSettings()) {
            return;
        }
        try {
            let result;
            result = await this.getWeather(device.getApiKey(), device.getLatitude(), device.getLongtitude());
            if(result!==null) {
                let weatherInfo = JSON.parse(result.body);
                let current = weatherInfo.currently;
                let daily = weatherInfo.daily.data;

                device.setCapabilityValue("measure_temperature", current.temperature);
                device.setCapabilityValue("measure_humidity", Math.round(current.humidity * 100));
                device.setCapabilityValue("measure_pressure", current.pressure);
                device.setCapabilityValue("measure_rain", current.precipIntensity);
                device.setCapabilityValue("measure_wind_strength", current.windSpeed*3.6);
                device.setCapabilityValue("measure_wind_angle", current.windBearing);
                device.setCapabilityValue("measure_gust_strength", current.windGust*3.6);
                device.setCapabilityValue("measure_visibility_capability", current.visibility);
                device.setCapabilityValue("measure_uvindex_capability", current.uvIndex);
                device.setCapabilityValue("measure_apparent_temperature_capability", current.apparentTemperature);
                device.setCapabilityValue("measure_cloudcover_capability",Math.round(current.cloudCover*100));
                let currentEpoch = (new Date).getTime();
                let timeDifference = this.retrievedDaily - currentEpoch;

                if (timeDifference < 0 || timeDifference >= HOUR_MILLISECONDS) {
                    device.setCapabilityValue("measure_temperature_high_capability", daily[0].temperatureHigh);
                    device.setCapabilityValue("measure_temperature_low_capability", daily[0].temperatureLow);
                    device.setCapabilityValue("measure_temperature_lowtime_capability", DarkskyDriver.formatDate(daily[0].temperatureLowTime));
                    device.setCapabilityValue("measure_temperature_hightime_capability", DarkskyDriver.formatDate(daily[0].temperatureHighTime));
                    this.retrievedDaily = currentEpoch;
                }
            }
        } catch (err) {
            this.log("Could not retrieve api data for device");
            this.log(err);
        }

    }

    static formatDate(epoch){

        let date = new Date(epoch*1000);
        let hours = date.getHours();
        let minutes = "0" + date.getMinutes();
        let seconds = "0" + date.getSeconds();
        return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    }

    validateApiKey(key,lat,long){
        return this.getWeather(key,lat,long);
    }

    async getWeather(key,lat,long){

        console.log("Get weather ");
        console.log(key);
        console.log(lat);
        console.log(long);
        let url = format(API_URL,key,lat,long);
        this.log(url);

        return new Promise((resolve,reject)=>{
            try{

               https.get(url,(res)=>{

                    if(res.statusCode === 200) {
                        let body = [];
                        res.on('data', (chunk) => {
                            this.log("retrieve data");
                            body.push(chunk);
                        });
                        res.on('end', () => {
                            this.log("Done retrieval of data");
                            resolve({
                                "body": Buffer.concat(body)
                            });
                        });
                    }else{
                        reject(null);
                    }
                }).on('error',(err)=>{
                    this.log(err);
                    reject(err);
                });

            }catch(e){
                reject(null);
            }


        });
    }


}

module.exports = DarkskyDriver;