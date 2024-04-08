import { Injectable } from '@angular/core';
import { Accounts } from './Accounts';
import { HttpRequestService } from '../../http-request.service';
import { SearchViewModel } from '../../Common/searchviewmodel';
import { Subscription } from 'rxjs';

@Injectable()
export class AccountsService {

    BaseUrl: string = "api/Accounts/";
    constructor(private http: HttpRequestService) { }
    GetAccount(Search: SearchViewModel) {
        let search = "";
        for (let key in Search) {
            if (search != "") {
                search += "&";
            }
            search += key + "=" + Search[key];
        }
        return this.http.authGet(this.BaseUrl + "Get?" + search, null);
    }
    DeleteAccount(ids) {
        return this.http.authGet(this.BaseUrl + "Delete?AccIds=" + ids, null);
    }
    DownLoadFile(Search: SearchViewModel) {
        let search = "";
        for (let key in Search) {
            if (search != "") {
                search += "&";
            }
            search += key + "=" + Search[key];
        }
        let Sub = this.http.authGetFile(this.BaseUrl + "Download?" + search, Search.fileType).subscribe(res => { Sub.unsubscribe(); });
    }
    SendFile(Search: SearchViewModel) {
        return this.http.authPost(this.BaseUrl + "SendFile", JSON.stringify(Search), null);
    }
    Save(AccountData: Accounts) {
        return this.http.authPost(this.BaseUrl + "Save", JSON.stringify(AccountData), null);
    }
    GetAll(GroupId: number) {
        return this.http.authGet(this.BaseUrl + "GetAll?GroupId=" + GroupId, null);
    }

}
