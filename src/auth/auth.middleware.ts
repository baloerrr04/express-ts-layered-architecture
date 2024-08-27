import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface UserData {
    id: number;
    username: string;
    phoneNumber: string;
}

interface ValidationRequest extends Request {
    userData?: UserData;
}

const accessValidation = async (req: Request, res: Response, next: NextFunction) => {
    const validationReq = req as ValidationRequest;
    const { authorization } = validationReq.headers;

    if (!authorization) {
        return res.status(401).json({ message: "Token diperlukan" });
    }

    const token = authorization.split(' ')[1];
    const secret = process.env.JWT_SECRET!;

    try {
        const jwtDecode = jwt.verify(token, secret);

        if (typeof jwtDecode !== 'string') {
            validationReq.userData = jwtDecode as UserData;
            next(); 
        } else {
            return res.status(401).json({ message: "Token tidak valid" });
        }
    } catch (error) {
        return res.status(401).json({
            message: "Token tidak valid atau sudah kadaluarsa"
        });
    }
};

export { accessValidation, ValidationRequest };
