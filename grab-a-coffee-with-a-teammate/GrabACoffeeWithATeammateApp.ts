import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
    IModify,
    IPersistence,
    IRead
} from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
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
                processor: async (jobContext, read: IRead, modify: IModify, http, persistence: IPersistence) => {
                    try {
                        let room = await read.getRoomReader().getByName("general");
                        this.getLogger().info(`id: ${room?.id}`);
                        if (room) {
                            if (room.creator) {
                                this.getLogger().log(`creatorId: ${room.creator.id}, name: ${room.creator.name}`);
                            }
                            let me = await read.getUserReader().getAppUser();
                            if (me) {
                                let members = await read.getRoomReader().getMembers(room.id);
                                members = members.filter(m => m.id != me?.id);
                                this.getLogger().log(members.map(m => m.name).join("|"));
                                const meAssoc = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, me?.id);
                                const previousDraw = await read.getPersistenceReader().readByAssociation(meAssoc);
                                let draw: any = null;
                                if (previousDraw) {
                                    this.getLogger().info(JSON.stringify(previousDraw));
                                    draw = this.newDraw(members.map(m => m.id), previousDraw[previousDraw.length -1]["draw"], 2);
                                } else {
                                    draw = this.newDraw(members.map(m => m.id), [], 2);
                                }

                                persistence.createWithAssociation({
                                    draw
                                }, meAssoc);
                                let msg = modify.getCreator().startMessage()
                                    .setRoom(room).setSender(me).setEmojiAvatar(":coffee:").setGroupable(true);
                                msg.setText("Hello all, it's time to discover your mate for a coffee:");
                                await modify.getCreator().finish(msg);
                                for (let index = 0; index < draw.length; index++) {
                                    const group = draw[index];
                                    const groupMembers = members.filter(m => group.indexOf(m.id) > -1);
                                    msg = modify.getCreator().startMessage()
                                        .setRoom(room).setSender(me).setEmojiAvatar(":coffee:").setGroupable(true);
                                    msg.setText("| " + groupMembers.map(m => `@${m.username}`).join(" :coffee: "));
                                    await modify.getCreator().finish(msg);
                                }

                            } else {
                                this.getLogger().log("Unable to get me");
                            }
                        }
                    } catch (e) {
                        this.getLogger().error(e)
                    }
                },
                // startupSetting: {
                //     type: StartupType.ONETIME,
                //     when: '5 seconds',
                //     data: { test: true },
                // }
                startupSetting: {
                    type: StartupType.RECURRING,
                    interval: '60 seconds'
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
                this.addItemsToGroup(groups, newPair);
        });
        pool = pool.concat(members.filter(i => previousMembers.indexOf(i) == -1));
        this.addItemsToGroup(groups, this.shuffle(pool));
        return groups;
    }
}
