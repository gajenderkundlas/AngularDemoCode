export class Accounts{
    accId: number;
    accName: string;
    accType: string;
    fyId: number;
    openbal: number;
    prevbal: number;
    advGroupId: number;
    advGroupName: string;
    underGroupId: number;
    underGroupName: string;
    baltype: string;
    ledgercode: string;
    name: string;
    address: string;
    cityid: number;
    stateid: number;
    countryid: number
    phoneNo: string;
    mobileNo: number;
    faxNo: string;
    email: string;
    CSTno: string;
    vatNo: string;
    panNo: string;
    tinNo: string;
    CSTDate: string;
    locationid: number;
    description: string;
    isActive: boolean;
    pGroupId: AccountUnderPrimaryGroup[]
}
export class AccountUnderPrimaryGroup {
    groupId: number;
    groupName: string;
    openingBalance: number;
    balanceType: string;
}
