import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';
export const settings: Array<ISetting> = [
    {
        id: 'Members_Room_Name',
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: 'RandomCoffee_Members_Room_Name',
        i18nDescription: 'RandomCoffee_Members_Room_Name_Description',
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
];