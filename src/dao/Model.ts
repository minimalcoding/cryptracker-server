import { List } from 'immutable';
import * as R from 'ramda';
import db from 'src/services/db';
import { ValidationResult, Exception, ExceptionCode } from 'src/errors'; 

export type DSO = { id: string } & object;

export default abstract class Model<R extends DSO> {
    private recordProvider: (input: any) => R;
    protected record: R;

    static tableName: string;

    get tableName(): string {
        return (<any>this.constructor).tableName;
    }

    set(input: {[key: string]: any}) {
        this.record = <R>{
            ...<object>this.record,
            ...input,
        };
    }

    static async createAll<R extends DSO, M extends Model<R>>(transactions: M[]): Promise<M[]> {
        return R.pipe(
            R.map((t: M) => t.save()),
            list => Promise.all(list),
        )(transactions);
    }

    static async remove(id: string): Promise<Boolean> {
        const rows = await db(this.tableName).where('id', id).del();
        return rows > 0;
    }

    static async all<R extends DSO, M extends Model<R>>(): Promise<R> {
        return db(this.tableName).select();
    }

    *[Symbol.iterator]() {
        for (var key in this.record) {
            yield this.record[key];
        }
    }

    constructor(
        input: any,
        recordProvider: (input: any) => R,
    ) {
        this.recordProvider = recordProvider;
        this.record = this.recordProvider(input);
    }

    abstract toJson(): object;
    abstract async validate(): Promise<ValidationResult>;
    abstract async beforeSave();

    async exists(): Promise<Boolean> {
        const result = await db
            .first('id')
            .from(this.tableName)
            .where({ id: this.record.id });
        if (result) {
            return result.id;
        }
    }

    async save(): Promise<string> {
        (await this.validate()).throwIfErrors();
        await this.beforeSave();
        try {
            if (await this.exists()) {
                await db
                    .update(this.toJson())
                    .into(this.tableName)
                    .where({ id: this.record.id });
            } else {
                await db
                    .insert(this.toJson())
                    .into(this.tableName);
            }             
        } catch (error) {
            throw new Exception(
                ExceptionCode.INTERNAL_SERVER_ERROR,
                error.message,
                error.stack,
                error.toString(),
            );
        }
        return this.record.id;
    }    

    serialize() {
        return JSON.stringify(this.toJson());
    }
};