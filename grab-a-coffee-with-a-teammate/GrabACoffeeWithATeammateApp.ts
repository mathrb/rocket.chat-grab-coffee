import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { StartupType } from '@rocket.chat/apps-engine/definition/scheduler';



export class GrabACoffeeWithATeammateApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend, environmentRead);        
    }

    public async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead) {
        configuration.scheduler.registerProcessors([
            {
                id: 'coffeePlanner',
                processor: async () => {
                    let room = await this.getAccessors().reader.getRoomReader().getByName("general");
                    this.getLogger().info(`id: ${room?.id}`);
                    if (room) {
                        if (room.creator) {
                            this.getLogger().log(`creatorId: ${room.creator.id}, name: ${room.creator.name}`);
                        }
                        let members = await this.getAccessors().reader.getRoomReader().getMembers(room.id);
                        this.getLogger().log(members.map(m => m.name).join("|"));
                        this.shuffle(members);
                        // do grouping
                    }
                },
                // startupSetting: {
                //     type: StartupType.ONETIME,
                //     when: '10 seconds',
                //     data: { test: true },
                // }
                startupSetting: {
                    type: StartupType.RECURRING,
                    interval: '20 seconds'
                }
            },
        ]);
    }

    // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    private shuffle(array: any[]) {
        let currentIndex = array.length, randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }
}
