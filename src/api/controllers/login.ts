import { json } from 'drizzle-orm/mysql-core';
import { Request, Response } from 'express';


import AES from 'crypto-js/aes';

import { eq } from 'drizzle-orm';
import * as argon2 from "argon2";

import { db } from 'src/db';
import * as schema from 'src/schema'
import generateSessionToken from '../utils/generateSessionToken';
import encryptClientInformation from '../utils/encryptClientInformation';
import hashString from '../utils/hashString';
import insertStaffSessionToken from '../repositories/insertStaffSessionToken';
import validateHash from '../utils/validateHash';
import selectStaffByUsername from '../repositories/selectStaffByUsername';
import insertLog from '../repositories/insertLog';

interface LoginRequest {
    username: string;
    password: string;
    client_information: string;
}

export default async function login(req: Request, res: Response){
    const jsonReq = req.body as Partial<LoginRequest>;

    if (!jsonReq.username) {
        return res.status(400).json({
            'status': 'MISSING_USERNAME',
            'message': 'username is missing in the request body field.',
            'data': {}
        });
    }

    if (!jsonReq.password) {
        return res.status(400).json({
            'status': 'MISSING_PASSWORD',
            'message': 'password is missing in the request body field.',
            'data': {}
        }); 
    }

    if (!jsonReq.client_information) {
        return res.status(400).json({
            'status': 'MISSING_CLIENT_INFO',
            'message': 'Missing client information (client_information) in request body field',
            'data': {}
        }); 
    }

    const result = await selectStaffByUsername(jsonReq.username)
    if (result.length <= 0) {
        return res.status(400).json({
            'status': 'BAD_USERNAME',
            'message': 'User does not exist!',
            'data': {}
        }); 
    }
    const relatedUser = result[0]

    try {
        if (!validateHash(jsonReq.password, relatedUser.hashedPassword)) {
            return res.status(400).json({
                'status': 'BAD_PASSWORD',
                'message': 'Password mismatch!',
                'data': {}
            }); 
        }

        const generatedToken =  generateSessionToken()
        const encryptedClientInfo = encryptClientInformation(jsonReq.client_information)
    
        const hashedToken = await hashString(generatedToken)
        await insertStaffSessionToken(hashedToken, relatedUser.id, encryptedClientInfo.toString())

        return res.status(200).json({
            'status': 'SUCCESS',
            'message': 'Login successful, save the session token inside data!',
            'data': {
                'session_token': generatedToken
            }
        }); 
      } catch (err) {
        await insertLog(`Failed to perform hashing verification :: ${err}`, "ERROR")
        return res.status(500).json({
            'status': 'SERVER_ERROR',
            'message': 'Server encountered an error! Contact admin if persists!',
            'data': {}
        }); 
      }
}