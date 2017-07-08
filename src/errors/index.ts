import * as R from 'ramda';

export enum ExceptionCode {
    BAD_REQUEST = 400,
    INTERNAL_SERVER_ERROR = 500,
}

export class Exception {
    message: string;
    code: ExceptionCode;
    stack: string;
    details: any;

    constructor(code: ExceptionCode, message: string, stack: string, details?: any) {
        this.message = message;
        this.code = code;
        this.stack = stack;
        this.details = details;
    }
};

export class ValidationResult {
    errors: {[property: string]: string}[];

    constructor() {
        this.errors = [];
    }

    push(error: {[property: string]: string}): ValidationResult {
        this.errors.push(error);
        return this;
    }

    get hasErrors() {
        return !R.isEmpty(this.errors);
    }

    throwIfErrors() {
        if (this.hasErrors) {
            throw new Exception(
                ExceptionCode.BAD_REQUEST,
                'Validation has failed, see error\'s constraints for more information.',
                new Error().stack,
                this.errors,
            );
        }
    }
}