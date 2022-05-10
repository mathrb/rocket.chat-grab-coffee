import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
    IModify,
    IPersistence,
    IRead,
    IConfigurationModify,
    IHttp
} from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { StartupType } from '@rocket.chat/apps-engine/definition/scheduler';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { settings } from './settings';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';



export class GrabACoffeeWithATeammateApp extends App {

    me: IUser;
    roomname: string;
    coffeeRoom: IRoom;
    groupsSize: number;
    trigger: string;
    initMessage: string;

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        const me = await this.getAccessors().reader.getUserReader().getAppUser();
        if (me) {
            this.me = me;
        } else {
            this.getLogger().error("unable to get app user.");
        }

        await this.extendConfiguration(configurationExtend, environmentRead);
    }

    public async onEnable(environment: IEnvironmentRead, configurationModify: IConfigurationModify): Promise<boolean> {
        this.roomname = await environment.getSettings().getValueById('Members_Room');
        if (this.roomname) {
            this.coffeeRoom = await this.getAccessors().reader.getRoomReader().getByName(this.roomname) as IRoom;
        }

        this.initMessage = await environment.getSettings().getValueById('Init_Message');
        this.groupsSize = await environment.getSettings().getValueById('Groups_Size');
        this.trigger = await environment.getSettings().getValueById('Trigger');
        configurationModify.scheduler.scheduleRecurring({ id: "coffeePlanner", "interval": this.trigger });
        this.getLogger().info(`Job configuration is: ${this.roomname}(${this.coffeeRoom}) ${this.groupsSize} ${this.trigger}`);
        return true;
    }

    public async onSettingUpdated(setting: ISetting, configModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
        switch (setting.id) {
            case 'Members_Room':
                this.roomname = setting.value;
                if (this.roomname) {
                    this.coffeeRoom = await read.getRoomReader().getByName(this.roomname) as IRoom;
                }
                break;
            case 'Groups_Size':
                this.groupsSize = setting.value;
                break;
            case 'Trigger':
                this.trigger = setting.value;
                configModify.scheduler.cancelJob("coffeePlanner");
                configModify.scheduler.scheduleRecurring({ id: "coffeePlanner", "interval": setting.value });
                this.getLogger().info(`Scheduling job with interval ${setting.value}`);
                break;
            case 'Init_Message':
                this.initMessage = setting.value;
                break;
        }
    }

    public async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead) {
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
        configuration.scheduler.registerProcessors([
            {
                id: 'coffeePlanner',
                processor: async (jobContext, read: IRead, modify: IModify, http, persistence: IPersistence) => {
                    try {
                        this.getLogger().info(`id: ${this.coffeeRoom?.id}`);
                        if (this.coffeeRoom) {
                            if (this.coffeeRoom.creator) {
                                this.getLogger().log(`creatorId: ${this.coffeeRoom.creator.id}, name: ${this.coffeeRoom.creator.name}`);
                            }
                            let members = await read.getRoomReader().getMembers(this.coffeeRoom.id);
                            members = members.filter(m => m.id != this.me.id);
                            this.getLogger().log(members.map(m => m.name).join("|"));
                            const meAssoc = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, this.me.id);
                            const previousDraw = await read.getPersistenceReader().readByAssociation(meAssoc);
                            let draw: any = null;
                            if (previousDraw && previousDraw.length > 0) {
                                this.getLogger().info(JSON.stringify(previousDraw));
                                draw = this.newDraw(members.map(m => m.id), previousDraw[previousDraw.length - 1]["draw"], this.groupsSize);
                            } else {
                                draw = this.newDraw(members.map(m => m.id), [], this.groupsSize);
                            }

                            persistence.updateByAssociation(meAssoc, {
                                draw
                            }, true);

                            let msg = modify.getCreator().startMessage()
                                .setRoom(this.coffeeRoom).setSender(this.me).setEmojiAvatar(":coffee:").setGroupable(true);
                            msg.setText(this.initMessage);
                            await modify.getCreator().finish(msg);
                            for (let index = 0; index < draw.length; index++) {
                                const group = draw[index];
                                const groupMembers = members.filter(m => group.indexOf(m.id) > -1);
                                msg = modify.getCreator().startMessage()
                                    .setRoom(this.coffeeRoom).setSender(this.me).setEmojiAvatar(":coffee:").setGroupable(true);
                                msg.setText("| " + groupMembers.map(m => `@${m.username}`).join(" :coffee: "));
                                await modify.getCreator().finish(msg);
                            }
                        }
                    } catch (e) {
                        this.getLogger().error(e)
                    }
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

    private addToGroup(groups: any[], item: any) {
        let minLength = -1;
        let idx = -1;
        for (let index = 0; index < groups.length; index++) {
            const element = groups[index];
            if (minLength == -1 || element.length < minLength) {
                minLength = element.length;
                idx = index;
            }
        }

        groups[idx].push(item);
    }

    private addItemsToGroup(groups: any[], items: any[]) {
        items.forEach(i => this.addToGroup(groups, i));
    }

    private newDraw(members: any[], previousDraw: any[], groupSize: number) {
        const groups: any[] = [];
        const numGroups = Math.trunc(members.length / groupSize);
        for (let index = 0; index < numGroups; index++) {
            groups.push([]);
        }
        let previousMembers: any[] = [];
        let pool: any[] = [];
        this.shuffle(previousDraw).forEach(pair => {
            previousMembers = previousMembers.concat(pair);
            const newPair = pair.filter(p => members.indexOf(p) != -1);
            if (newPair.length != pair.length)
                pool = pool.concat(newPair);
            else
                this.addItemsToGroup(groups, this.shuffle(newPair));
        });
        pool = pool.concat(members.filter(i => previousMembers.indexOf(i) == -1));
        this.addItemsToGroup(groups, this.shuffle(pool));
        return groups;
    }
}
