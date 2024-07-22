import { MetadataCategoryEnum } from "../Common/enum";

export default abstract class BaseMetadata {
    public category: MetadataCategoryEnum;

    public identifier: string;

    protected data: Object = {};

    constructor(category: MetadataCategoryEnum, identifier: string) {
        this.category = category;
        this.identifier = identifier;
    }

    protected async getData(): Promise<Object> {
        return {};
    }

    public async toObject() {
        return {
            category: this.category,
            identifier: this.identifier,
            data: await this.getData()
        };
    }

}