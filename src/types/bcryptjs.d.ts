declare module "bcryptjs" {
    interface Bcrypt {
        hash(data: string, saltOrRounds: number | string): Promise<string>;
        compare(data: string, encrypted: string): Promise<boolean>;
    }
    const bcrypt: Bcrypt;
    export default bcrypt;
}
