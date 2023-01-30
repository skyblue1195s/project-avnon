export interface IQuestion {
    question?: string;
    type?: 'paragraphy' | 'checkbox';
    answer?: any;
    isRequired?: boolean;
    isOther?: boolean
}
export interface IAnswer {
    id?: number;
    value?: string
}
