import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  UntypedFormControl,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ListQuestion, QuestionType } from '@constants/constant';
import { IQuestion } from '@interfaces/question.interface';
import { QuestionService } from '@services/question/question.service';
import { isEmpty } from 'lodash';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { atLeastOneCheckboxCheckedValidator } from 'src/app/common/helper/atLeastOneCheckboxCheckedValidator';

@Component({
  selector: 'app-list-questions',
  templateUrl: './list-questions.component.html',
  styleUrls: ['./list-questions.component.scss'],
})
export class ListQuestionsComponent implements OnInit {
  validateForm: FormGroup;

  listOfData: IQuestion[] = JSON.parse(
    localStorage.getItem(ListQuestion) || '[]'
  );
  loading = false;
  isOpen = false;
  dataChanged = new Subject();
  isSubmitted = false;

  constructor(
    private _questionService: QuestionService,
    private _router: Router,
    private _fb: FormBuilder
  ) {
    this.validateForm = this._fb.group({});
    this.dataChanged
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((data: any) => {
        this.listOfData[data?.i].answer = data?.value;
        localStorage.setItem(ListQuestion, JSON.stringify(this.listOfData));
      });
  }

  ngOnInit(): void {
    this.getListQuestions();
    if (!isEmpty(this.listOfData)) {
      this.addValidate();
    }
  }

  getListQuestions() {
    this._questionService.listQuestions.subscribe((data) => {
      this.listOfData = data;
      this.addValidate();
    });
  }

  buildCategoryFormArr(anwser: any[], isRequired: boolean, selectedCategoryIds: string[] = []) {
    let group = this._fb.group(
      {},
      {
        validators: isRequired ? atLeastOneCheckboxCheckedValidator() : [],
      }
    );
    anwser.forEach((x) => {
      let isSelected = selectedCategoryIds.some((id) => id === x.id);
      group.addControl(x.id, this._fb.control(isSelected));
    });
    return group;
  }

  addValidate() {
    this.listOfData.map((x, i) => {
      if (x.type === 'checkbox') {
        this.validateForm.addControl(
          `question_${i}`,
          this.buildCategoryFormArr(x.answer, x.isRequired || false)
        );
        x.answer.map((x: any) => {
          this.validateForm
            .get(`question_${i}`)
            ?.get(x.id.toString())
            ?.setValue(x.selected);
        });
      } else {
        this.validateForm.addControl(
          `question_${i}`,
          new UntypedFormControl(
            x.answer,
            x.isRequired ? Validators.required : []
          )
        );
      }
    });
  }

  openProductForm(): void {
    this._questionService.isOpen.next(true);
  }

  viewReviewAnswer() {
    if (this.validateForm.valid) {
      this.isSubmitted = false;
      this.loading = true;
      setTimeout(() => {
      this._router.navigate(['/form/answers']);
      this.loading = false;
      }, 1500);
    } else {
      this.isSubmitted = true;
      Object.values(this.validateForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  checkShowError(i: number) {
    return (
      this.validateForm.hasError(
        'requireCheckboxToBeChecked',
        `question_${i}`
      ) && this.isSubmitted
    );
  }

  handlerChange(e: any, i: number, y?: any): void {
    if (this.listOfData[i].type === QuestionType.checkbox) {
      this.checkShowError(i);
      const { checked } = e.target;
      this.listOfData[i].answer[Number(y)].selected = checked;
      localStorage.setItem(ListQuestion, JSON.stringify(this.listOfData));
    } else {
      const { value } = e.target;
      this.dataChanged.next({ i, value });
    }
  }
}
