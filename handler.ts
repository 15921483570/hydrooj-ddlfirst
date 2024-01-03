import { Context, PERM,ContestModel, UserModel } from 'hydrooj';

async function getHomework(domainId, limit = 5) {

    if (!this.user.hasPerm(PERM.PERM_VIEW_HOMEWORK)) return [[], {}];
    const groups = (await UserModel.listGroup(domainId,
        this.user.hasPerm(PERM.PERM_VIEW_HIDDEN_HOMEWORK) ? undefined :
            this.user._id))
        .map((i) => i.name);

    const tdocs = await ContestModel
        .getMulti(domainId, {
            rule: 'homework',
            // Add a condition to filter out finished homeworks
            endAt: { $gte: new Date() },
            ...this.user.hasPerm(PERM.PERM_VIEW_HIDDEN_HOMEWORK)
                ? {}
                : {
                    $or: [
                        { maintainer: this.user._id },
                        { owner: this.user._id },
                        { assign: { $in: groups } },
                        { assign: { $size: 0 } },
                    ],
                },
        })
        .sort({
            endAt: 1,
            penaltySince: 1,
            beginAt: 1,
            _id: 1,
        })
        .limit(limit)
        .toArray();

    const tsdict = await ContestModel.getListStatus(
        domainId, this.user._id, tdocs.map((tdoc) => tdoc.docId),
    );

    return [tdocs, tsdict];
}

export async function apply(ctx: Context) {
    ctx.withHandlerClass('HomeHandler', (h) => {
        h.prototype.getHomework = getHomework;
    });
}