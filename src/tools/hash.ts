import * as crypto from 'crypto';
import * as moment from 'moment';

const crypt = (value: string, alg: string): string => {
    const sha1 = crypto.createHash(alg);
    sha1.update(value || moment().unix().toString());
    return sha1.digest('hex');
}
export const md5 = (value?: string): string => crypt(value, 'md5');
export const sha1 = (value?: string): string => crypt(value, 'sha1');
