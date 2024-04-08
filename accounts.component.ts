import { Component, OnInit,HostListener } from '@angular/core';
import { Accounts, AccountUnderPrimaryGroup } from './Accounts';
import { SessionService } from '../../session.service';
import { AccountsService } from './accounts.service';
import { AccountGroupService } from '../account-group/account-group.service';
import { AccountGroup } from '../account-group/AccountGroup';
import { FinancialYearService } from '../financial-year/financial-year.service';
import { DataTableModule, SharedModule, EditorModule, AutoCompleteModule, MultiSelectModule, DropdownModule, SelectItem } from 'primeng/primeng';
import { SearchViewModel } from '../../Common/searchviewmodel';
import { Message } from 'primeng/components/common/api';
import { MessageService } from 'primeng/components/common/messageservice';
import { EmailComponent } from '../../email/email.component';
import { FormBuilder, Validators, FormGroup, FormControl, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Validator } from '../../Common/Validation';
import { SelectedItem } from '../../Common/SelectedItem';
import { StateService } from '../../Fees/state/state.service';
import { State } from '../../Fees/state/State';
import { CityService } from '../../Fees/city/city.service';
import { City } from '../../Fees/city/City';
import { OpeningBalanceService } from '../opening-balance/opening-balance.service';
import { OpeningBalanceModel } from '../opening-balance/OpeningBalance';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css'],
  providers: [AccountsService, AccountGroupService, StateService, CityService, FinancialYearService, OpeningBalanceService]
})
export class AccountsComponent implements OnInit {
  TabAccount: string = "";
  TabAddress: string = "";
  TabRegistration: string = "";
  TabOpening: string = "";
  AccountForm: FormGroup;
  AccountEdit: Accounts;
  AccountData: Accounts[]; 
  session: SessionService;
  UnderGroupData: SelectItem[];
  PrimaryGroupData: SelectItem[];
  StateData: SelectItem[];
  CityData: SelectItem[];  
  PrimaryGroupDataSelectedIds: number[];
  SelectedUnderGroup: number;
  SelectedState: SelectItem;
  SelectedCity: SelectItem;
  CurrentFinancialYear: number;
  FinancialYearData: SelectItem[];
  PrimaryGroupOBData: AccountUnderPrimaryGroup[];
  SearchView: SearchViewModel = {
      id: 0,
      first: 0,
      rows: 10,
      globalFilter: "",
      sendfile: {
          To: "",
          Cc: "",
          Body: "",
          AttachmentType: "Excel",
          Subject: ""
      },
      courseId: 0,
      semesterId: 0,  
      batch: 0,
      fyId: 0,
      acId: 0,
  };
  View: string = "list";
  TotalRecords: number = 0;
  selectedIds: Accounts[];
  constructor(private message: MessageService, private OBMethod: OpeningBalanceService, private FinancialYearMethod: FinancialYearService, private stateMethod: StateService, private cityMethod: CityService, private fb: FormBuilder, private AccountGroupMethod: AccountGroupService, private AccountMethod: AccountsService, private _session: SessionService) {
      this.session = _session;
      this.AccountEdit = new Accounts();
      this.PrimaryGroupOBData = [];
      this.AccountForm = this.fb.group({
          AccountName: ["", Validators.required],
          AccountType: ["", Validators.required],
          PrimaryGroup: ["", Validators.required],
          UnderGroup: ["", Validators.required],
          LedgerCode: [""],
          Description:[""],
          IsActive: [""],
          Name: [""],
          Address: [""],
          State: [""],
          City: [""],
          MobileNo: ["", Validators.compose([Validator.IsNumber, Validator.NumberRange(1000000000,9999999999)])],
          FaxNo: [""],
          Email: ["", Validator.Email],
          Pincode: [""],
          PanNo: [""],
          OpenBal: [""],
          BalType: [""],
          FinancialYear: [""],
          OpeningBalance: new FormArray([]),
          BalanceType: new FormArray([])
      })
  }
  ngOnInit() {
      this.GetAccountUnderGroup();
      this.GetFinancialYear();
      this.stateMethod.GetAll().subscribe(res => {
          if (res.json().isSuccess) {
              let _stateData = res.json().data as State[];
              this.StateData = [];
              this.CityData = [];
              this.StateData.push({ label: "--Select State--", value: null });
              this.CityData.push({ label: "--Select City--", value: null });
              for (let state of _stateData) {
                  this.StateData.push({ label: state.state, value: state.stateId });
              }
          } else {
              this.message.add({ severity: 'error', summary: 'Error!', detail: res.json().error });
          }
      }, error => {
          this.message.add({ severity: 'error', summary: 'Error!', detail: error });
      })
  }
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
      if (event.keyCode == 13) {
          if (this.View == "add") {
              this.Save();
          } else {
              this.Search();
          }
          return false;
      }
  }
  GetCity(event) {
      this.AccountEdit.stateid = event.value;
      this.cityMethod.GetAll(this.AccountEdit.stateid).subscribe(res => {
          if (res.json().isSuccess) {
              let _cityData = res.json().data as City[];
              this.CityData = [];
              this.CityData.push({ label: "--Select City--", value: null });
              for (let city of _cityData) {
                  this.CityData.push({ label: city.city, value: city.cityId });
              }
              if (this.AccountEdit.accId > 0) {
                  this.AccountForm.controls["City"].setValue(this.AccountEdit.cityid);
              }
          } else {
              this.message.add({ severity: 'error', summary: 'Error!', detail: res.json().error });
          }
      }, error => {
          this.message.add({ severity: 'error', summary: 'Error!', detail: error });
      })
  }
  ChangeCity(event) {
      this.AccountEdit.cityid = event.value;
  }
  GetFinancialYear() {
      this.FinancialYearData = [];
      this.FinancialYearMethod.GetAll().subscribe(res => {
          if (res.json().isSuccess) {
              let _financialYearData = res.json().data;
              for (let fy of _financialYearData) {
                  if (fy.isCurrentFinancialYear) {
                      this.CurrentFinancialYear = fy.fyId;
                  }
                  this.FinancialYearData.push({ label: fy.fyTitle, value: fy.fyId });
              }
            
          } else {
              this.message.add({ severity: 'error', summary: 'Error!', detail: res.json().error });
          }
      }, error => {
          this.message.add({ severity: 'error', summary: 'Error!', detail: error });
      })
  }
  GetAccountPrimaryGroup() {
      this.AccountGroupMethod.GetAllPrimaryGroup(this.AccountEdit.underGroupId).subscribe(res => {
          if (res.json().isSuccess) {
              if (res.json().data.length > 0) {
                  let _primaryGroupData = res.json().data as AccountGroup[];
                  this.PrimaryGroupData = [];
                  for (let group of _primaryGroupData) {
                      this.PrimaryGroupData.push({ label: group.groupName, value: group.groupId});
                  }
                  if (this.AccountEdit.accId > 0) {
                      this.PrimaryGroupDataSelectedIds = [];
                      this.PrimaryGroupOBData = [];
                      if (this.AccountEdit.accId > 0) {
                          if (this.AccountEdit.pGroupId != undefined) {
                              for (let group of this.AccountEdit.pGroupId) {
                                  if (this.PrimaryGroupData.find(x => x.value == group.groupId) != undefined) {
                                      if (this.PrimaryGroupData.find(x => x.value == group.groupId).value == group.groupId) {
                                          this.PrimaryGroupDataSelectedIds.push(group.groupId);
                                          this.PrimaryGroupOBData.push({ groupId: group.groupId, groupName: group.groupName, balanceType: group.balanceType, openingBalance: group.openingBalance });
                                      }
                                  }
                              }
                              this.OpeningBalanceEdit(this.PrimaryGroupOBData);
                          }
                      }
                  } else {
                      this.PrimaryGroupDataSelectedIds = [];
                  }
              }
          } else {
              this.message.add({ severity: 'error', summary: 'Error!', detail: res.json().error });
          }
      }, error => {
          this.message.add({ severity: 'error', summary: 'Error!', detail: error });
      }
      )
  }
  ChangeTab(tab: string) {
      this.TabAccount = "";
      this.TabAddress = "";
      this.TabRegistration = "";
      this.TabOpening = "";
      if (tab == "Accounts") {
          this.TabAccount = "in active";
      } else if (tab == "Address") {
          this.TabAddress = "in active";
      } else if (tab == "Registration") {
          this.TabRegistration = "in active";
      } else if (tab == "Opening") {
          this.TabOpening = "in active";
      } else {
          this.TabAccount = "in active";
          this.message.add({ severity: 'info', summary: 'Info!', detail: "Please save account information to enable all other tabs." });
      }
  }
  PrimaryGroupSelectChange(event) {
      this.PrimaryGroupOBData = [];
      for (let val of event.value) {
          let accUnderPrimaryGroup = new AccountUnderPrimaryGroup();
          accUnderPrimaryGroup.groupId = val;
          accUnderPrimaryGroup.groupName = this.PrimaryGroupData.find(x => x.value == val).label;
          accUnderPrimaryGroup.balanceType = "C";
          accUnderPrimaryGroup.openingBalance = 0;
          this.PrimaryGroupOBData.push(accUnderPrimaryGroup);
      }
      this.OpeningBalanceEdit(this.PrimaryGroupOBData);
  }
  OpeningBalanceEdit(accUnderPrimaryGroup: AccountUnderPrimaryGroup[]) {
      let i = 0;
      for (let val of accUnderPrimaryGroup) {
          let OpeningBalanceControls = this.AccountForm.get("OpeningBalance") as FormArray;
          let BalanceTypeControls = this.AccountForm.get("BalanceType") as FormArray;
          if (OpeningBalanceControls.controls[i]) {
              OpeningBalanceControls.controls[i].setValue(val.openingBalance);
          } else {
              let OpeningBalanceControl = new FormControl(val.openingBalance, Validator.IsNumber);
              OpeningBalanceControls.push(OpeningBalanceControl);
          }
          if (BalanceTypeControls.controls[i]) {
              BalanceTypeControls.controls[i].setValue(val.balanceType);
          } else {
              let BalanceTypeControl = new FormControl(val.balanceType);
              BalanceTypeControls.push(BalanceTypeControl);
          }
          i = i + 1;
      }
  } 
  GetAccountUnderGroup() {
      this.UnderGroupData = [];
      this.UnderGroupData.push({ label: "--Select Under Group--", value: null });
      this.AccountGroupMethod.GetAll(0).subscribe(res => {
          if (res.json().isSuccess) {
              if (res.json().data.length > 0) {
                  let _underGroupData = res.json().data as AccountGroup[];
                  for (let group of _underGroupData) {
                      this.UnderGroupData.push({ label: group.groupName, value: group.groupId });
                  }
              }
          } else {
              this.message.add({ severity: 'error', summary: 'Error!', detail: res.json().error });
          }
      }, error => {
          this.message.add({ severity: 'error', summary: 'Error!', detail: error });
      }
      )
  }
  Add() {
      this.AccountEdit = new Accounts();
      this.AccountEdit.accType = "";
      this.AccountEdit.accId = 0;
      this.AccountEdit.isActive = true;
      this.View = "add";
      this.AccountEdit.accType = "Account";
      this.ChangeTab("Accounts");
      this.GetAccountUnderGroup();
      this.AccountForm.controls["FinancialYear"].setValue(this.CurrentFinancialYear);
      this.AccountEdit.fyId = this.CurrentFinancialYear;
  }
  GetPrimaryGroup(event) {
      this.AccountEdit.underGroupId = event.value;
      this.GetAccountPrimaryGroup();
  }
  Cancel($event) {
      this.View = "list";
      this.SearchView.id = 0;
  }
  SendFile() {
      this.View = "email";
  }
  FinancialYearChange(event) {
      this.AccountEdit.fyId = event.value;
      if (this.AccountEdit.accId > 0) {
          let OpeningBalance = new OpeningBalanceModel();
          OpeningBalance.accId = this.AccountEdit.accId;
          OpeningBalance.fyId = this.AccountEdit.fyId;
          OpeningBalance.pGroupId = 0;
          OpeningBalance.accName = "";
          OpeningBalance.underGroupId = 0;
          OpeningBalance.rows = 1000;
          OpeningBalance.first = 0;
          this.OBMethod.GetOpeningBalance(OpeningBalance).subscribe(res => {
              if (res.json().isSuccess) {
                  if (res.json().data.length > 0) {
                      let _obData = res.json().data as OpeningBalanceModel[];
                      this.PrimaryGroupOBData = [];
                      for (let OB of _obData) {
                          this.PrimaryGroupOBData.push({ groupId: OB.pGroupId, groupName: OB.pGroupName, balanceType: OB.balanceType, openingBalance: OB.openingBalance });
                      }
                      this.OpeningBalanceEdit(this.PrimaryGroupOBData);
                  }
              } else {
                  this.message.add({ severity: 'error', summary: 'Error!', detail: res.json().error });
              }
          }, error => {
              this.message.add({ severity: 'error', summary: 'Error!', detail: error });
          })
      }
  }
  Save() {
      if (this.AccountForm.valid) {
          if (this.PrimaryGroupDataSelectedIds.length > 0) {
              let OpeningBalanceControls = this.AccountForm.get("OpeningBalance") as FormArray;
              let BalanceTypeControls = this.AccountForm.get("BalanceType") as FormArray;
              let _accountUnderPrimaryGroup: AccountUnderPrimaryGroup[] = [];
              let i = 0;
              for (let PrimaryGroupId of this.PrimaryGroupDataSelectedIds) {
                  let _balanceType = BalanceTypeControls.controls[i].value;
                  let _openingBalance = OpeningBalanceControls.controls[i].value;
                  _accountUnderPrimaryGroup.push({ groupId: PrimaryGroupId, groupName: "", openingBalance: _openingBalance, balanceType: _balanceType });
                  i = i + 1;
              }
              this.AccountEdit.pGroupId = _accountUnderPrimaryGroup;
          }
          this.AccountMethod.Save(this.AccountEdit).subscribe(res => {
              if (res.json().isSuccess) {
                  this.message.add({ severity: 'success', summary: 'Success!', detail: 'Account added successfully.' });
                  if (res.json().data.length > 0) {
                      this.View = "list";
                      this.SearchView.id = 0;
                  }
              } else {
                  this.message.add({ severity: 'error', summary: 'Error!', detail: res.json().error });
              }
          },
              error => {
                  this.message.add({ severity: 'error', summary: 'Error!', detail: error });
              }
          )
      } else {
          this.message.add({ severity: 'error', summary: 'Error!', detail: "Please fill the required fields first." });
      }
  }
  Search() {
      this.SearchView.id = 0;
      this.View = "list";
      this.SearchView.first = 0;
      this.SearchView.rows = 10
      if (this.View == "list") {
          this.LoadAccounts(this.SearchView);
      }

  }
  Delete(CityId: number) {
      let Ids: any;
      if (CityId == 0) {
          if (this.selectedIds != undefined && this.selectedIds.length > 0) {
              Ids = this.selectedIds.map(x => x.accId).join("&AccIds=");
          } else {
              this.message.add({ severity: 'error', summary: 'No Record Selected.', detail: 'Please select at least one record for delete.' });
          }
      } else {
          Ids = CityId;
      }
      if (Ids != undefined) {
          this.AccountMethod.DeleteAccount(Ids)
              .subscribe(res => {
                  this.Search();
                  this.message.add({ severity: 'success', summary: 'Record Deleted Successfully.', detail: 'Selected record(s) deleted successfully.' });
              })
      }
  }

  Edit(AccId: number) {
      this.SearchView.id = AccId;
      this.SearchView.globalFilter = "";
      this.SearchView.rows = 1;
      this.SearchView.first = 0;
      this.AccountMethod.GetAccount(this.SearchView).subscribe(res => {
          if (res.json().data.length > 0) {
              let AccountDataEdit: Accounts = <Accounts>res.json().data[0];
              this.AccountEdit = AccountDataEdit;
              this.View = "add";
              this.ChangeTab("Accounts");
              this.CityData = [];
              this.AccountForm.controls["UnderGroup"].setValue(this.AccountEdit.underGroupId);
              this.AccountForm.controls["State"].setValue(this.AccountEdit.stateid);
              this.GetCity({ value: this.AccountEdit.stateid});
              this.GetPrimaryGroup({ value: this.AccountEdit.underGroupId });
              if (this.AccountEdit.fyId == undefined || this.AccountEdit.fyId == 0) {
                  this.AccountForm.controls["FinancialYear"].setValue(this.CurrentFinancialYear);
                  this.AccountEdit.fyId = this.CurrentFinancialYear;
              } else {
                  this.AccountForm.controls["FinancialYear"].setValue(this.AccountEdit.fyId);
              }
              if (this.AccountEdit.baltype == "" || this.AccountEdit.baltype == undefined) {
                  this.AccountEdit.baltype = "C";
              }
          }
      })
  }
  Download(type: string) {
      this.SearchView.id = 0;
      this.SearchView.first = 0;
      this.SearchView.rows = 10000000;
      this.SearchView.fileType = type;
      this.AccountGroupMethod.DownLoadFile(this.SearchView);
  }
  SendEmail(Search: SearchViewModel) {
      this.SearchView.id = 0;
      this.SearchView.first = 0;
      this.SearchView.rows = 10000000;
      let Error = 0;
      if (this.SearchView.sendfile.Body == "" && this.SearchView.sendfile.Subject == "") {
          if (confirm("Are you sure you want to send email without subject and body?")) {
              Error = 0;
          } else {
              Error = 1;
          }
      } else {
          if (this.SearchView.sendfile.Subject == "") {
              if (confirm("Are you sure you want to send email without subject?")) {
                  Error = 0;
              } else {
                  Error = 1;
              }
          }
          if (this.SearchView.sendfile.Body == "") {
              if (confirm("Are you sure you want to send email without body?")) {
                  Error = 0;
              } else {
                  Error = 1;
              }
          }
      }
      if (Error == 0) {
          this.AccountGroupMethod.SendFile(this.SearchView).subscribe(res => {
              if (res.json().isSuccess) {
                  this.message.add({ severity: 'success', summary: 'Email Sent', detail: 'Your email sent successfully.' });
                  this.ResetEmail();
              } else {
                  this.message.add({ severity: 'error', summary: 'Error!', detail: res.json().error });
              }
          },
              error => {
                  this.message.add({ severity: 'error', summary: 'Error!', detail: error });
              }
          );
      }
  }
  ResetEmail() {
      this.SearchView.sendfile.AttachmentType = "Excel";
      this.SearchView.sendfile.To = "";
      this.SearchView.sendfile.Cc = "";
      this.SearchView.sendfile.Body = "";
      this.SearchView.sendfile.Subject = "";
  }
  LoadAccounts(search: SearchViewModel) {
      console.log(search.sortField);
      console.log(search.sortOrder);

      if (search.globalFilter == null) {
          search.globalFilter = this.SearchView.globalFilter;
      }
      if (search.first == undefined) {
          search.first = 0;
      }
      if (search.rows == undefined) {
          search.rows = 10;
      }
      if (search.fyId == undefined) {
          search.fyId = 0;
      }
      console.log(search.rows);
      this.AccountMethod.GetAccount(search)
          .subscribe(res => {
              if (res.json().isSuccess) {
                  this.AccountData = res.json().data as Accounts[];
                  this.TotalRecords = res.json().totalRecords;
              } else {
                  this.message.add({ severity: 'error', summary: 'Error!', detail: res.json().Error });
              }
          },
          error => {
              this.message.add({ severity: 'error', summary: 'Error!', detail: error });
          }
          )
  }
  SetName() {
      this.AccountEdit.name = this.AccountEdit.accName;
  }
}
