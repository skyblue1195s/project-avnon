import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  UntypedFormControl,
  Validators,
} from '@angular/forms';
import { QuestionType } from '@constants/constant';
import { IAnswer } from '@interfaces/question.interface';
import { QuestionService } from '@services/question/question.service';
import { get } from 'lodash';
import { distinctUntilChanged, Subject } from 'rxjs';
import { debounceTime } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-answer-form',
  templateUrl: './answer-form.component.html',
  styleUrls: ['./answer-form.component.scss'],
})
export class AnswerFormComponent implements OnInit {
  visible = false;
  validateForm: FormGroup;
  loading = false;
  title = 'Add Question';
  answers: IAnswer[] = [];
  listOfAnswer: Array<{ id: number; controlInstance: string }> = [];
  dataChanged = new Subject();

  constructor(
    private _questionService: QuestionService,
    private _fb: FormBuilder
  ) {
    this.validateForm = this._fb.group({
      type: [QuestionType.paragraphy, [Validators.required]],
      question: ['', [Validators.required]],
      isRequired: [false],
    });
    this.dataChanged
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((data: any) => {
        this.answers[data?.index].value = data?.value;
      });
  }

  ngOnInit(): void {
    this.handlerOpen();
  }

  handlerOpen(): void {
    this._questionService.isOpen.subscribe((isOpen) => (this.visible = isOpen));
  }

  close(): void {
    this.visible = false;
    this._questionService.isOpen.next(false);
  }

  submitForm(e: any): void {
    this.loading = true;
    const body = this.validateForm.value;
    if (QuestionType.checkbox === body.type) {
      this.listOfAnswer.map((x) => {
        this.answers.push({ id: x.id, value: get(body, x.controlInstance) });
      });
      body.answer = this.answers;
      if (body.isOther) {
        body.answer.push({ id: uuidv4(), value: 'Other' });
      }
    }
    this._questionService.addNewQuestion(body);
    this.loading = false;
    this.close();
    this.answers = [];
    this.validateForm.reset()
    this.listOfAnswer = []
    this.validateForm = this._fb.group({
      type: [QuestionType.paragraphy, [Validators.required]],
      question: ['', [Validators.required]],
      isRequired: [false],
    });
  }

  handlerChange(e: any, i: number) {
    const { value } = e.target;
    this.dataChanged.next({ index: i, value });
  }

  handlerChangeType(e: any) {
    if (e === 'checkbox') {
      this.validateForm.addControl('isOther', new UntypedFormControl(null, []));
      this.addField();
    }
  }

  addField(e?: MouseEvent): void {
    if (e) {
      e.preventDefault();
    }
    const id =
      this.listOfAnswer.length > 0
        ? this.listOfAnswer[this.listOfAnswer.length - 1].id + 1
        : 0;

    const control = {
      id,
      controlInstance: `anwser${id}`,
    };
    const index = this.listOfAnswer.push(control);
    this.validateForm.addControl(
      this.listOfAnswer[index - 1].controlInstance,
      new UntypedFormControl(null, Validators.required)
    );
  }

  removeField(i: { id: number; controlInstance: string }, e: MouseEvent): void {
    e.preventDefault();
    if (this.listOfAnswer.length > 1) {
      const index = this.listOfAnswer.indexOf(i);
      this.listOfAnswer.splice(index, 1);
      this.validateForm.removeControl(i.controlInstance);
    }
  }
}
