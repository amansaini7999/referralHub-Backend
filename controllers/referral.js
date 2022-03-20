const firebase = require("../db");
const firestore = firebase.firestore();
const admin = require("firebase-admin");
const { validationResult } = require("express-validator");


exports.getReferralByCompany = async (req,res) =>{
    try{
        // console.log(req);
        const {lastInd} = req.query;
        let {company} = req.query;
        
        const user = (await firestore.collection('users').doc(req.user.user_id).get()).data();
        // console.log(user.isReferee);
        if(!user.isReferee)
        {
            // console.log(user);
            company = user.current_company;
        }
        else
        {
            return res.status(403).send({
                message: "You can't see Referral"
            })
        }
        
        // console.log(company);
        company = company.toLowerCase();
        const pageSize = 3;
        let allReferral =  (await firestore.collection('referral').doc(company).get());
        if(!allReferral.exists)
        {
            return res.status(202).send({
                data: []
            });
        }
        allReferral=allReferral.data();
        const referral = allReferral.data;
        let firstInd = referral.length - 1;
        if(lastInd){
            firstInd = lastInd;
        }
        let needReferral = [];
        let hasNext = 0;
        let lastId;
        for(let i = firstInd; i >= 0 ; i--)
        {
            if(referral[i].isActive)
            {
                let alreadyRejected = false;
                for(let rejectedByRef of referral[i].rejectedBy)
                {
                    if(rejectedByRef.id == req.user.user_id){
                        // console.log("good");
                        alreadyRejected = true;
                        break;
                    }   
                }
                if(alreadyRejected)continue;
                const candidate = (await firestore.collection('users').doc(referral[i].candidate).get()).data();
                const job = (await firestore.collection('job-listings').doc(referral[i].jobReference).get()).data();
                // console.log(candidate);
                // console.log(job);
                data = {
                    company: job.company,
                    jobId: job.jobId,
                    jobLink: job.jobLink,
                    canName: candidate.name,
                    canEmail: candidate.email,
                    canPhone: candidate.phone_number,
                    canId: candidate.user_id,
                    canResume: candidate.resume_link,
                    id: i
                }
                // console.log(data);
                needReferral.push(data);
                // console.log("there");
                if(needReferral.length == pageSize+1)
                {
                    hasNext =  1;
                    lastId = i;
                    needReferral.pop();
                    break;
                }
            }
        }
        res.send({
            data: needReferral,
            hasNext,
            lastId,
            company
        });

    }catch(err){
        // console.log(err);
        res.status(500).send({
            message: "Internal error occurred",
            error: err,
        });
    }

};

exports.getReferralByJob = async (req,res) =>{
    try{
        const {jobId} = req.query;
        let {lastInd} = req.query;
        // console.log(jobId);

        if(!jobId)
        {
            return res.status(400).send("No Job Id given");
        }

        const job = await firestore.collection('job-listings').doc(jobId).get();
        // console.log(job);
        if(!job.exists)
        {
            return res.status(400).send("No Job present with this Id");
        }
        const user = await firestore.collection('users').doc(req.user.user_id).get();
        if(user.data().current_company != job.data().company)
        {
            return res.status(403).send({
                message: "You can't see referral for this job"
            })
        }
        const refReqArr = job.data().requested_referral;
        // console.log(refReqArr);
        if(!lastInd){
            lastInd = refReqArr.length - 1;
        }
        const pageSize = 3;
        let needReferral = [];
        let hasNext = 0;
        let lastId;
        // console.log(lastInd);
        let company = job.data().company;
        company = company.toLowerCase();
        let allReferral = (await firestore.collection('referral').doc(company).get());
        if(!allReferral.exists)
        {
            return res.status(202).send({
                data: []
            });
        }
        allReferral=allReferral.data().data;
        // console.log(allReferral);

        for(let i=lastInd;i>=0;i--)
        {
            const nowInd = refReqArr[i].refInd;
            // console.log(nowInd);
            if(allReferral[nowInd].isActive)
            {
                let alreadyRejected = false;
                for(let rejectedByRef of allReferral[nowInd].rejectedBy)
                {
                    if(rejectedByRef.id == req.user.user_id)
                    {
                        alreadyRejected = true;
                        break;
                    }
                }
                if(alreadyRejected)continue;
                const candidate = (await firestore.collection('users').doc(allReferral[nowInd].candidate).get()).data();
                const job = (await firestore.collection('job-listings').doc(allReferral[nowInd].jobReference).get()).data();
                // console.log(candidate);
                // console.log(job);
                data = {
                    company: job.company,
                    jobId: job.jobId,
                    jobLink: job.jobLink,
                    canName: candidate.name,
                    canEmail: candidate.email,
                    canPhone: candidate.phone_number,
                    canId: candidate.user_id,
                    canResume: candidate.resume_link,
                    id: i
                }
                // console.log(data);
                needReferral.push(data);
                // console.log("there");
                if(needReferral.length == pageSize+1)
                {
                    hasNext =  1;
                    lastId = i;
                    needReferral.pop();
                    break;
                }
            }
        }
        res.status(200).send({
            data: needReferral,
            hasNext,
            lastId,
            jobId
        })

    }catch(err){
        // console.log(err);
        res.status(500).send({
            message: "Internal error occurred",
            error: err,
        });
    }

};

exports.giveFeedback = async (req,res) => {
    try {
        let {company} = req.query;
        const {ind} = req.query;
        const feedbackData = req.body.feedback;
        // console.log(company);
        // console.log(ind);
        // console.log(feedbackData.feedback);
        let UserIsReferee;
        await firestore.collection('users').doc(req.user.user_id).get().then((docSnap) => {
            UserIsReferee = docSnap.data().isReferee;
        })
        // console.log(UserIsReferee);
        if(UserIsReferee)
        {
            return res.send({
                message: "You can't give feedback"
            })
        }   
        if(!company || !ind || !feedbackData)
        {
            return res.status(400).send("Insufficient data");
        }
        company = company.toLowerCase();
        let referral = (await firestore.collection('referral').doc(company).get());
        if(!referral.exists)
        {
            return res.send({
                message: "No Referral exists"
            })
        }
        referral = referral.data().data[ind];
        if(!referral.isActive)
        {
            return res.send({
                message: "Referral does not exist"
            });
        }
        // console.log(referral.jobReference);
        // console.log(referral.candidate);
        let data = {
            type: "feedback",
            jobref: firestore.doc('users/' + referral.jobReference),
            givenBy: firestore.doc('users/' + req.user.user_id),
            msg: feedbackData
        }
        firestore.collection('users').doc(referral.candidate).update({
            referral_feedback: admin.firestore.FieldValue.arrayUnion(data)
        }).then(res.send({
            message:"Feedback given"
        }));
        
    } catch (error) {
        // console.log(error);
        res.status(500).send({
            message: "Internal error occurred",
            error: error,
        });
    }
};

exports.giveReferral = async (req,res) => {
    try {
        let {company} = req.query;
        const {ind} = req.query;
        // console.log(company);
        // console.log(ind);
        // console.log(feedbackData.feedback);
        let UserIsReferee;
        await firestore.collection('users').doc(req.user.user_id).get().then((docSnap) => {
            UserIsReferee = docSnap.data().isReferee;
        })
        // console.log(UserIsReferee);
        if(UserIsReferee)
        {
            return res.send({
                message: "You can't refer"
            })
        }
        if(!company || !ind)
        {
            return res.status(400).send("Insufficient data");
        }
        company = company.toLowerCase();
        let allReferral = (await firestore.collection('referral').doc(company).get());
        if(!allReferral.exists)
        {
            return res.send({
                message: "No Referral exists"
            })
        }
        allReferral = allReferral.data().data;
        const referral = allReferral[ind];
        if(!referral.isActive)
        {
            return res.status(200).send({
                message: "Referral does not exist"
            });
        }
        // console.log(referral.jobReference);
        // console.log(referral.candidate);
        let feedbackData = {
            type: "refer",
            jobref: firestore.doc('users/' + referral.jobReference),
            givenBy: firestore.doc('users/' + req.user.user_id)
        }
        firestore.collection('users').doc(referral.candidate).update({
            referral_feedback: admin.firestore.FieldValue.arrayUnion(feedbackData)
        });
        let remData = [];
        for(let i=0;i<allReferral.length;i++)
        {
            if(i!=ind)
            {
                remData.push(allReferral[i]);
            }
            else{
                let dd = allReferral[i];
                dd.isActive = false;
                remData.push(dd);
            }
        }
        await firestore.collection('referral').doc(company).update({
            data: remData
        })

        // console.log(feedbackData);
        res.send({
            message: "Referred"
        });
        
    } catch (error) {
        // console.log(error);
        res.status(500).send({
            message: "Internal error occurred",
            error: error,
        });
    }
};

exports.rejectReferral = async (req,res) => {
    try {
        let {company} = req.query;
        const {ind} = req.query;
        // console.log(company);
        // console.log(ind);
        // console.log(feedbackData.feedback);
        let UserIsReferee;
        await firestore.collection('users').doc(req.user.user_id).get().then((docSnap) => {
            UserIsReferee = docSnap.data().isReferee;
        })
        // console.log(UserIsReferee);
        if(UserIsReferee)
        {
            return res.send({
                message: "You can't reject"
            })
        }
        if(!company || !ind)
        {
            return res.status(400).send("Insufficient data");
        }
        company = company.toLowerCase();
        let allReferral = (await firestore.collection('referral').doc(company).get());
        if(!allReferral.exists)
        {
            return res.send({
                message: "No Referral exists"
            })
        }
        allReferral = allReferral.data().data;
        const referral = allReferral[ind];
        for(let rejectedByRef of referral.rejectedBy)
        {
            if(rejectedByRef.id == req.user.user_id){
                return res.send({
                    message: "Already been Rejected"
                });
            }   
        }
        if(!referral.isActive)
        {
            return res.status(200).send({
                message: "Referral does not exist"
            });
        }
        // console.log(referral.jobReference);
        // console.log(referral.candidate);
        let feedbackData = {
            type: "reject",
            jobref: firestore.doc('users/' + referral.jobReference),
            givenBy: firestore.doc('users/' + req.user.user_id)
        }
        firestore.collection('users').doc(referral.candidate).update({
            referral_feedback: admin.firestore.FieldValue.arrayUnion(feedbackData)
        });
        let remData = [];
        for(let i=0;i<allReferral.length;i++)
        {
            if(i!=ind)
            {
                remData.push(allReferral[i]);
            }
            else{
                let dd = allReferral[i];
                if(dd.nosRejected === 4)
                {
                    dd.isActive = false;
                }
                else{
                    dd.nosRejected = dd.nosRejected +1;
                    const by = {
                        id: req.user.user_id
                    }
                    dd.rejectedBy.push(by);
                }
                remData.push(dd);
            }
        }
        await firestore.collection('referral').doc(company).update({
            data: remData
        })

        // console.log(feedbackData);
        res.send({
            message: "Rejected"
        });
        
    } catch (error) {
        // console.log(error);
        res.status(500).send({
            message: "Internal error occurred",
            error: error,
        });
    }
}