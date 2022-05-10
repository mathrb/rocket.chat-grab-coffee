import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';
export const settings: Array<ISetting> = [
    {
        id: 'Members_Room',
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'RandomCoffee_Members_Room_Name',
        i18nDescription: 'RandomCoffee_Members_Room_Description',
    },
    {
        id: 'Init_Message',
        type: SettingType.STRING,
        packageValue: 'This weeks random coffees are:',
        required: true,
        public: false,
        i18nLabel: 'RandomCoffee_Init_Message_Name',
        i18nDescription: 'RandomCoffee_Init_Message_Description',
    },
    {
        id: 'Groups_Size',
        type: SettingType.NUMBER,
        packageValue: 2,
        required: true,
        public: false,
        i18nLabel: 'RandomCoffee_Groups_Size',
        i18nDescription: 'RandomCoffee_Groups_Size_Description',
    },
    {
        id: 'Trigger',
        type: SettingType.STRING,
        packageValue: '0 9 * * 1',
        required: true,
        public: false,
        i18nLabel: 'Trigger_Name',
        i18nDescription: 'Trigger_Description',
    },
];